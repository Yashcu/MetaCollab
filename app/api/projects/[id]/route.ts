import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { Task } from "@/lib/models/Task";
import { Invitation } from "@/lib/models/Invitation";
import { pusherServer } from "@/lib/pusher";
import { projectUpdateSchema } from "@/lib/validations";
import { isValidObjectId } from "@/lib/utils";
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

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid project ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // Membership check is baked into the query — non-members get a 404
    const project = await Project.findOne({
      _id: id,
      "members.userId": userId,
    }).lean();

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
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const parsed = projectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    // Only include fields that were actually provided
    const allowedUpdates = {
      ...(parsed.data.name && { name: parsed.data.name.trim() }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description.trim() }),
    };

    await connectDB();

    const updatedProject = await Project.findOneAndUpdate(
      { _id: id, owner: userId },
      allowedUpdates,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedProject) {
      return NextResponse.json(
        { message: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // Notify all project members of the change
    await pusherServer.trigger(
      `private-project-${id}`,
      "project:updated",
      updatedProject
    );

    return NextResponse.json(
      { success: true, data: updatedProject, message: "Project updated successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("PATCH /api/projects/[id]", error);
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

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid project ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findOneAndDelete({
      _id: id,
      owner: userId,
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // Cascade: clean up tasks and invitations tied to this project
    await Promise.all([
      Task.deleteMany({ project: id }),
      Invitation.deleteMany({ project: id }),
    ]);

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

    return NextResponse.json(
      { success: true, data: null, message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("DELETE /api/projects/[id]", error);
  }
}