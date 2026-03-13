import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, serverError } from "@/lib/api";

export const runtime = "nodejs";

// Admin-only dashboard stats
export async function GET() {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const client = await clerkClient();
    const totalUsers = await client.users.getCount();

    // Parallel fetch for efficiency
    const [totalProjects, tasksCompleted] = await Promise.all([
      prisma.project.count(),
      prisma.task.count({ where: { status: "done" } }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: { totalUsers, totalProjects, tasksCompleted },
        message: "Dashboard stats fetched successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("GET /api/admin", error);
  }
}