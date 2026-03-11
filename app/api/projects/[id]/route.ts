import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { Task } from "@/lib/models/Task";
import { Invitation } from "@/lib/models/Invitation";
import { pusherServer } from "@/lib/pusher";

export const runtime = "nodejs";

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/projects/[id] — fetch a single project (user must be a member)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid project ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // User must be in the members array to view this project
    const project = await Project.findOne({
      _id: id,
      "members.userId": userId,
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
    console.error("[GET /api/projects/[id]] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] — update project name or description (owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Only allow updating these specific fields — never trust the full body
    const allowedUpdates = {
      ...(body.name && typeof body.name === "string" && { name: body.name.trim() }),
      ...(body.description !== undefined && typeof body.description === "string" && {
        description: body.description.trim(),
      }),
    };

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400 }
      );
    }

    await connectDB();

    // Only the project owner can edit project details
    const updatedProject = await Project.findOneAndUpdate(
      { _id: id, owner: userId },
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return NextResponse.json(
        { message: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // Notify all project members that the project details changed
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
    console.error("[PATCH /api/projects/[id]] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] — delete project and all its tasks/invitations (owner only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid project ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // Only the project owner can delete it
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

    // Cascade delete: remove all tasks that belonged to this project
    await Task.deleteMany({ project: id });

    // Cascade delete: remove all pending invitations for this project
    await Invitation.deleteMany({ project: id });

    // Notify all project members that the project was deleted
    // (they will need to remove it from their UI)
    await pusherServer.trigger(
      `private-project-${id}`,
      "project:deleted",
      { projectId: id }
    );

    // Also notify every member's personal dashboard so their
    // project list refreshes — without this the deleted project
    // stays visible on their dashboard until they manually refresh
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
    console.error("[DELETE /api/projects/[id]] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}