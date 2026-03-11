import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { Task } from "@/lib/models/Task";
import { requireAuth, serverError } from "@/lib/api";
import { resolveRole } from "@/lib/utils";

export const runtime = "nodejs";

// Admin-only dashboard stats
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Verify admin role from Clerk public metadata
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const role = resolveRole(clerkUser.publicMetadata as Record<string, unknown>);

    if (role !== "admin") {
      return NextResponse.json(
        { message: "Access denied. Admins only." },
        { status: 403 }
      );
    }

    await connectDB();

    const totalUsers = await client.users.getCount();

    // Parallel fetch for efficiency
    const [totalProjects, tasksCompleted] = await Promise.all([
      Project.countDocuments(),
      Task.countDocuments({ status: "done" }),
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