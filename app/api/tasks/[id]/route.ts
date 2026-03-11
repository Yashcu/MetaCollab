import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/lib/models/Task";
import { Project } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";

export const runtime = "nodejs";

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// PATCH /api/tasks/[id] — update a task's fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    if (!isValidObjectId(taskId)) {
      return NextResponse.json(
        { message: "Invalid task ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    await connectDB();

    // Find the task first so we can check project membership
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Check the user is a member of the project this task belongs to
    const project = await Project.findOne({
      _id: task.project,
      "members.userId": userId,
    });

    if (!project) {
      return NextResponse.json(
        { message: "You do not have access to this project's tasks" },
        { status: 403 }
      );
    }

    // IMPORTANT: Only allow updating specific fields — never pass raw body to MongoDB.
    // If we passed body directly, a user could change task.project to a project
    // they don't own, which is a mass-assignment vulnerability.
    const allowedStatuses = ["todo", "in-progress", "done"];
    const allowedPriorities = ["low", "medium", "high"];

    const safeUpdates: Record<string, unknown> = {};

    if (body.title && typeof body.title === "string") {
      safeUpdates.title = body.title.trim();
    }
    if (body.description !== undefined && typeof body.description === "string") {
      safeUpdates.description = body.description.trim();
    }
    if (body.status && allowedStatuses.includes(body.status)) {
      safeUpdates.status = body.status;
    }
    if (body.priority && allowedPriorities.includes(body.priority)) {
      safeUpdates.priority = body.priority;
    }
    if (body.order !== undefined && typeof body.order === "number") {
      safeUpdates.order = body.order;
    }
    if (body.assigneeId !== undefined) {
      // Allow null to unassign, or a string Clerk ID to assign
      safeUpdates.assignee =
        typeof body.assigneeId === "string" ? body.assigneeId : undefined;
    }
    if (body.dueDate !== undefined) {
      safeUpdates.dueDate = body.dueDate ? new Date(body.dueDate) : undefined;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      safeUpdates,
      { new: true, runValidators: true }
    );

    // Broadcast the updated task list to all project members
    const allTasks = await Task.find({ project: task.project }).sort("order");
    await pusherServer.trigger(
      `private-project-${task.project}`,
      "tasks:updated",
      allTasks
    );

    return NextResponse.json(
      { success: true, data: updatedTask, message: "Task updated successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[PATCH /api/tasks/[id]] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] — delete a task (any project member can delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    if (!isValidObjectId(taskId)) {
      return NextResponse.json(
        { message: "Invalid task ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // User must be a project member to delete tasks
    const project = await Project.findOne({
      _id: task.project,
      "members.userId": userId,
    });

    if (!project) {
      return NextResponse.json(
        { message: "You do not have access to this project's tasks" },
        { status: 403 }
      );
    }

    await Task.findByIdAndDelete(taskId);

    // Broadcast updated task list after deletion
    const remainingTasks = await Task.find({ project: task.project }).sort("order");
    await pusherServer.trigger(
      `private-project-${task.project}`,
      "tasks:updated",
      remainingTasks
    );

    return NextResponse.json(
      { success: true, data: null, message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[DELETE /api/tasks/[id]] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}