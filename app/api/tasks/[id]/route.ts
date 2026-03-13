import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { taskUpdateSchema } from "@/lib/validations";
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

    const body = await req.json();

    const parsed = taskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Membership check — any project member can update tasks
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "You do not have access to this project's tasks" },
        { status: 403 }
      );
    }

    const safeUpdates = parsed.data;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: safeUpdates,
    });

    // Notify project members of the change
    await pusherServer.trigger(
      `private-project-${task.projectId}`,
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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Any project member can delete — no owner-only restriction
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "You do not have access to this project's tasks" },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    // Notify project members the task was removed
    await pusherServer.trigger(
      `private-project-${task.projectId}`,
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