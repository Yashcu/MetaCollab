import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: typeof description === "string" ? description.trim() : "",
        owner: userId,
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
      include: {
        members: true,
      },
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
export async function GET(req: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Pagination — defaults: page 1, 20 per page, max 50
    const page  = Math.max(1, parseInt(req.nextUrl.searchParams.get("page")  ?? "1", 10));
    const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10));
    const skip  = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        // Return only what the dashboard card needs — no full member rows
        select: {
          id: true,
          name: true,
          description: true,
          owner: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              members: true,
              tasks: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.project.count({
        where: { members: { some: { userId } } },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: projects,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        message: "Projects fetched successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("GET /api/projects", error);
  }
}