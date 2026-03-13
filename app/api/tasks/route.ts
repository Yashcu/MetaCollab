import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { taskSchema } from "@/lib/validations";
import { requireAuth, validationError, serverError } from "@/lib/api";

export const runtime = "nodejs";

// Create a new task inside a project
export async function POST(req: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { title, description, project: projectId, assigneeId, status, priority } = parsed.data;

    // Only project members can create tasks
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "Project not found or you are not a member" },
        { status: 403 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? "",
        projectId,
        assignee: assigneeId ?? null,
        status: status ?? "todo",
        priority: priority ?? "medium",
      },
    });

    // Real-time notification to project channel
    await pusherServer.trigger(
      `private-project-${projectId}`,
      "task:created",
      task
    );

    return NextResponse.json(
      { success: true, data: task, message: "Task created successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    return serverError("POST /api/tasks", error);
  }
}

// Get all tasks for a project — requires projectId query param
export async function GET(req: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const projectId = req.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { message: "projectId query parameter is required" },
        { status: 400 }
      );
    }

    // Gate the query behind a membership check
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "Project not found or you do not have access" },
        { status: 403 }
      );
    }

    // Pagination — defaults: page 1, 50 per page, max 100
    const page  = Math.max(1, parseInt(req.nextUrl.searchParams.get("page")  ?? "1", 10));
    const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10));
    const skip  = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: { projectId },
        orderBy: { order: "asc" },
        take: limit,
        skip,
      }),
      prisma.task.count({ where: { projectId } }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: tasks,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        message: "Tasks fetched successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("GET /api/tasks", error);
  }
}