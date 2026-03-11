import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { Task } from "@/lib/models/Task";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    // Step 1: Check the user is logged in
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Check the user is an admin via Clerk public metadata
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userRole = clerkUser.publicMetadata.role;

    if (userRole !== "admin") {
      return NextResponse.json(
        { message: "Access denied. Admins only." },
        { status: 403 }
      );
    }

    // Step 3: Connect to DB and fetch stats
    await connectDB();

    // Get total number of registered users from Clerk
    const totalUsers = await client.users.getCount();

    // Get total projects and completed tasks from MongoDB
    const totalProjects = await Project.countDocuments();
    const tasksCompleted = await Task.countDocuments({ status: "done" });

    return NextResponse.json(
      {
        success: true,
        data: { totalUsers, totalProjects, tasksCompleted },
        message: "Dashboard stats fetched successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Log the real error on the server — never send it to the client
    console.error("[GET /api/admin] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}