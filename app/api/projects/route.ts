import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import type { IProjectMember } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";

export const runtime = "nodejs";

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const name: unknown = body.name;
    const description: unknown = body.description;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { message: "Project name is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Create the project with the creator as the owner
    // members array uses IProjectMember shape: { userId, role }
    const project = await Project.create({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      owner: userId,
      members: [{ userId, role: "owner" }] as IProjectMember[],
    });

    // Tell the creator's dashboard to refresh so the new project appears
    await pusherServer.trigger(
      `private-user-${userId}`,
      "dashboard:refetch",
      {}
    );

    return NextResponse.json(
      { success: true, data: project, message: "Project created successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/projects] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/projects — fetch all projects the logged-in user belongs to
export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Query uses dot notation to search inside the members array of objects
    // This works because we added an index on "members.userId" in the model
    const projects = await Project.find({ "members.userId": userId });

    return NextResponse.json(
      { success: true, data: projects, message: "Projects fetched successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/projects] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}