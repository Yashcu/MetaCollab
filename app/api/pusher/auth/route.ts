import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { requireAuth, serverError } from "@/lib/api";

export const runtime = "nodejs";

// Pusher private-channel auth endpoint.
// Verifies the user has the right to subscribe to the requested channel
// before handing back a signed auth token.
export async function POST(req: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Pusher sends auth requests as URL-encoded form data
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

    // Authorisation rules:
    //   private-user-{clerkUserId}   — user's own personal channel only
    //   private-project-{projectId}  — project channel, membership required
    //
    // Any other channel format is rejected outright.

    if (channelName.startsWith("private-user-")) {
      const channelUserId = channelName.replace("private-user-", "");
      if (channelUserId !== userId) {
        return NextResponse.json(
          { message: "You can only subscribe to your own user channel" },
          { status: 403 }
        );
      }
    } else if (channelName.startsWith("private-project-")) {
      const projectId = channelName.replace("private-project-", "");

      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { message: "You are not a member of this project" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { message: "Unknown channel format" },
        { status: 400 }
      );
    }

    // All checks passed — return the signed Pusher auth token
    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error: unknown) {
    return serverError("POST /api/pusher/auth", error);
  }
}