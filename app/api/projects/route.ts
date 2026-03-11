import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import type { IProjectMember } from "@/lib/models/Project";
import { projectSchema } from "@/lib/validations";
import { requireAuth, validationError, serverError } from "@/lib/api";

export const runtime = "nodejs";

// Create a new project — creator is automatically set as owner
export async function POST(req: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();

    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { name, description } = parsed.data;

    await connectDB();

    const project = await Project.create({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      owner: userId,
      // Owner is also added as a member so membership queries work uniformly
      members: [{ userId, role: "owner" }] as IProjectMember[],
    });

    return NextResponse.json(
      { success: true, data: project, message: "Project created successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    return serverError("POST /api/projects", error);
  }
}

// Get all projects the current user belongs to
export async function GET(_req: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    await connectDB();

    const projects = await Project.find({ "members.userId": userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { success: true, data: projects, message: "Projects fetched successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("GET /api/projects", error);
  }
}