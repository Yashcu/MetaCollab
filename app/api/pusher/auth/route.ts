import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Step 1: User must be logged in
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Parse the Pusher auth request body
    const data = await req.text();
    const urlParams = new URLSearchParams(data);

    const socketId = urlParams.get("socket_id");
    const channelName = urlParams.get("channel_name");

    if (!socketId || !channelName) {
      return NextResponse.json(
        { message: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    // Step 3: Verify the user actually has access to this channel.
    // We support two channel formats:
    //   private-user-{clerkUserId}     — user's personal channel
    //   private-project-{projectId}   — a project's channel
    //
    // Without this check, any logged-in user could subscribe to any channel.

    if (channelName.startsWith("private-user-")) {
      // Personal channel — only allow if it's the user's own channel
      const channelUserId = channelName.replace("private-user-", "");
      if (channelUserId !== userId) {
        return NextResponse.json(
          { message: "You can only subscribe to your own user channel" },
          { status: 403 }
        );
      }
    } else if (channelName.startsWith("private-project-")) {
      // Project channel — only allow if user is a member of that project
      const projectId = channelName.replace("private-project-", "");

      await connectDB();

      const project = await Project.findOne({
        _id: projectId,
        "members.userId": userId,
      });

      if (!project) {
        return NextResponse.json(
          { message: "You are not a member of this project" },
          { status: 403 }
        );
      }
    } else {
      // Unknown channel format — reject it
      return NextResponse.json(
        { message: "Unknown channel format" },
        { status: 400 }
      );
    }

    // Step 4: All checks passed — generate the Pusher auth token
    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error: unknown) {
    console.error("[POST /api/pusher/auth] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}