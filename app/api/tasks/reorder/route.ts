import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, serverError } from "@/lib/api";
import { z } from "zod";

export const runtime = "nodejs";

const reorderSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  tasks: z
    .array(
      z.object({
        id: z.string().uuid("Invalid task ID"),
        order: z.number(),
      })
    )
    .min(1, "At least one task is required"),
});

/**
 * PATCH /api/tasks/reorder
 *
 * Replaces the N+1 drag-drop pattern: one network call + one DB transaction
 * for the entire reorder instead of one PATCH per task.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { projectId, tasks } = parsed.data;

    // Single membership check before touching any data
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "Project not found or you are not a member" },
        { status: 403 }
      );
    }

    // One transaction — all order updates are atomic
    await prisma.$transaction(
      tasks.map(({ id, order }) =>
        prisma.task.update({
          where: { id },
          data: { order },
        })
      )
    );

    return NextResponse.json(
      { success: true, message: "Task order saved" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("PATCH /api/tasks/reorder", error);
  }
}
