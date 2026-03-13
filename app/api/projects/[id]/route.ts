import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { projectUpdateSchema } from "@/lib/validations";
import { requireAuth, validationError, serverError } from "@/lib/api";

export const runtime = "nodejs";

// Get a single project — user must be a member
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Membership check is baked into the query — non-members get a 404
    const project = await prisma.project.findFirst({
      where: {
        id,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found or you do not have access" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: project, message: "Project fetched successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("GET /api/projects/[id]", error);
  }
}

// Update project name/description — owner only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const body = await req.json();
  const parsed = projectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  // Only include fields that were actually provided
  const allowedUpdates = {
    ...(parsed.data.name && { name: parsed.data.name.trim() }),
    ...(parsed.data.description !== undefined && {
      description: parsed.data.description.trim(),
    }),
  };

  try {
    const updatedProject = await prisma.project.update({
      where: { id, owner: userId }, // single-query owner guard — throws P2025 if not owner
      data: allowedUpdates,
      include: { members: true }, // Always include members so clients fully hydrate
    });

    // Notify all project members of the change — include members so clients can update state
    await pusherServer.trigger(
      `private-project-${id}`,
      "project:updated",
      updatedProject
    );

    return NextResponse.json(
      { success: true, data: updatedProject, message: "Project updated successfully" },
      { status: 200 }
    );
  } catch (e: unknown) {
    // P2025 = record not found (project doesn't exist OR caller isn't the owner)
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }
    return serverError("PATCH /api/projects/[id]", e);
  }
}

// Delete a project and cascade-remove its tasks and invitations — owner only
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!project || project.owner !== userId) {
      return NextResponse.json(
        { message: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // Cascade: clean up tasks and invitations tied to this project
    // Prisma will handle cascade deletes if configured in schema.prisma (`onDelete: Cascade`),
    // which we already set for `Task`, `ProjectMember`, and `Invitation`.
    await prisma.project.delete({
      where: { id },
    });

    // Let connected clients know the project is gone
    await pusherServer.trigger(
      `private-project-${id}`,
      "project:deleted",
      { projectId: id }
    );

    // Refresh the dashboard for every former member
    const memberTriggers = project.members.map(
      (member: { userId: string }) =>
        pusherServer.trigger(
          `private-user-${member.userId}`,
          "dashboard:refetch",
          {}
        )
    );

    await Promise.all(memberTriggers);

    // 204 No Content — correct REST response for a successful DELETE
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return serverError("DELETE /api/projects/[id]", error);
  }
}