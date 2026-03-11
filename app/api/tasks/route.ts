import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/lib/models/Task";
import { Project } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";
import { taskSchema } from "@/lib/validations";
import { isValidObjectId } from "@/lib/utils";
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

    await connectDB();

    // Only project members can create tasks
    const isMember = await Project.exists({
      _id: projectId,
      "members.userId": userId,
    });

    if (!isMember) {
      return NextResponse.json(
        { message: "Project not found or you are not a member" },
        { status: 403 }
      );
    }

    const taskDoc = await Task.create({
      title: title.trim(),
      description: description?.trim() ?? "",
      project: projectId,
      assignee: assigneeId ?? undefined,
      status: status ?? "todo",
      priority: priority ?? "medium",
    });

    const task = taskDoc.toObject();

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

    if (!isValidObjectId(projectId)) {
      return NextResponse.json(
        { message: "Invalid project ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // Gate the query behind a membership check
    const isMember = await Project.exists({
      _id: projectId,
      "members.userId": userId,
    });

    if (!isMember) {
      return NextResponse.json(
        { message: "Project not found or you do not have access" },
        { status: 403 }
      );
    }

    const tasks = await Task.find({ project: projectId })
      .sort({ order: 1 })
      .select("-__v")
      .lean();

    return NextResponse.json(
      { success: true, data: tasks, message: "Tasks fetched successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("GET /api/tasks", error);
  }
}