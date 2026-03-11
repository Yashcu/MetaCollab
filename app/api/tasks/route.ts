import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/lib/models/Task";
import { Project } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";

export const runtime = "nodejs";

// POST /api/tasks — create a new task inside a project
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const title: unknown = body.title;
    const description: unknown = body.description;
    const projectId: unknown = body.project;
    const assigneeId: unknown = body.assigneeId;   // Clerk user ID of the assignee
    const status: unknown = body.status;
    const priority: unknown = body.priority;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { message: "Task title is required" },
        { status: 400 }
      );
    }

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { message: "Project ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the current user is actually a member of the project
    const project = await Project.findOne({
      _id: projectId,
      "members.userId": userId,
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found or you are not a member" },
        { status: 403 }
      );
    }

    // Only allow valid status and priority values
    const allowedStatuses = ["todo", "in-progress", "done"];
    const allowedPriorities = ["low", "medium", "high"];

    const finalStatus = allowedStatuses.includes(status as string)
      ? (status as string)
      : "todo";

    const finalPriority = allowedPriorities.includes(priority as string)
      ? (priority as string)
      : "medium";

    // Create the task
    const task = await Task.create({
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      project: projectId,
      assignee: typeof assigneeId === "string" ? assigneeId : undefined,
      status: finalStatus,
      priority: finalPriority,
    });

    // Broadcast updated task list to all project members
    const allTasks = await Task.find({ project: projectId }).sort("order");
    await pusherServer.trigger(
      `private-project-${projectId}`,
      "tasks:updated",
      allTasks
    );

    return NextResponse.json(
      { success: true, data: task, message: "Task created successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/tasks] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/tasks?projectId=xxx — fetch all tasks for a project
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { message: "projectId query parameter is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user is a member before returning tasks
    const project = await Project.findOne({
      _id: projectId,
      "members.userId": userId,
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found or you do not have access" },
        { status: 404 }
      );
    }

    // Sort by order field so kanban columns appear in the right sequence
    const tasks = await Task.find({ project: projectId }).sort("order");

    return NextResponse.json(
      { success: true, data: tasks, message: "Tasks fetched successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/tasks] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}