import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/lib/models/Task";
import { Project } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";
import { taskUpdateSchema } from "@/lib/validations";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth, validationError, serverError } from "@/lib/api";

export const runtime = "nodejs";

// Update a task — any project member can update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id: taskId } = await params;

    if (!isValidObjectId(taskId)) {
      return NextResponse.json(
        { message: "Invalid task ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const parsed = taskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    await connectDB();

    const task = await Task.findById(taskId).select("project").lean();
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Membership check — any project member can update tasks
    const isMember = await Project.exists({
      _id: task.project,
      "members.userId": userId,
    });

    if (!isMember) {
      return NextResponse.json(
        { message: "You do not have access to this project's tasks" },
        { status: 403 }
      );
    }

    const safeUpdates = parsed.data;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      safeUpdates,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Notify project members of the change
    await pusherServer.trigger(
      `private-project-${task.project}`,
      "task:updated",
      updatedTask
    );

    return NextResponse.json(
      { success: true, data: updatedTask, message: "Task updated successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("PATCH /api/tasks/[id]", error);
  }
}

// Delete a task — any project member can delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id: taskId } = await params;

    if (!isValidObjectId(taskId)) {
      return NextResponse.json(
        { message: "Invalid task ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const task = await Task.findById(taskId).select("project").lean();
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Any project member can delete — no owner-only restriction
    const isMember = await Project.exists({
      _id: task.project,
      "members.userId": userId,
    });

    if (!isMember) {
      return NextResponse.json(
        { message: "You do not have access to this project's tasks" },
        { status: 403 }
      );
    }

    await Task.findByIdAndDelete(taskId);

    // Notify project members the task was removed
    await pusherServer.trigger(
      `private-project-${task.project}`,
      "task:deleted",
      { taskId }
    );

    return NextResponse.json(
      { success: true, data: null, message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("DELETE /api/tasks/[id]", error);
  }
}