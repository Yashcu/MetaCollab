import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Invitation } from "@/lib/models/Invitation";
import { Project } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";
import mongoose from "mongoose";
import { requireAuth, serverError } from "@/lib/api";

export const runtime = "nodejs";

// Accept or decline an invitation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid invitation ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const action: unknown = body.action;

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { message: "Invalid action. Must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    await connectDB();

    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return NextResponse.json(
        { message: "Invitation not found" },
        { status: 404 }
      );
    }

    // Confirm the invitation belongs to the current user
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    if (!userEmail || invitation.recipient.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { message: "This invitation was not sent to you" },
        { status: 403 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { message: "This invitation has already been responded to" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Guard against adding the same user twice if they somehow accept twice
      const alreadyMember = await Project.exists({
        _id: invitation.project,
        "members.userId": userId,
      });

      if (alreadyMember) {
        invitation.status = "accepted";
        await invitation.save();
        return NextResponse.json(
          { success: true, message: "Already a member" },
          { status: 200 }
        );
      }

      const updatedProject = await Project.findByIdAndUpdate(
        invitation.project,
        { $push: { members: { userId, role: "member" } } },
        { new: true }
      );

      invitation.status = "accepted";
      await invitation.save();

      if (updatedProject) {
        // Notify existing members the project changed
        await pusherServer.trigger(
          `private-project-${updatedProject._id}`,
          "project:updated",
          updatedProject
        );

        // Announce the new member to the project channel
        await pusherServer.trigger(
          `private-project-${updatedProject._id}`,
          "user:joined",
          {
            userId: userId,
            userName: clerkUser.fullName || clerkUser.firstName || "User",
            avatarUrl: clerkUser.imageUrl,
          }
        );
      }

      // Tell the inviter their invitation was accepted
      await pusherServer.trigger(
        `private-user-${invitation.inviter}`,
        "invitation:accepted",
        {
          projectId: invitation.project,
          projectName: updatedProject?.name ?? "a project",
          recipientId: userId,
          recipientName: clerkUser.fullName || clerkUser.firstName || "A user",
        }
      );

      // Trigger a dashboard refresh for the newly joined user
      await pusherServer.trigger(
        `private-user-${userId}`,
        "dashboard:refetch",
        {}
      );

      return NextResponse.json(
        { success: true, message: "Invitation accepted successfully" },
        { status: 200 }
      );
    }

    // Decline path
    invitation.status = "declined";
    await invitation.save();

    await pusherServer.trigger(
      `private-user-${invitation.inviter}`,
      "invitation:declined",
      {
        projectId: invitation.project,
        recipientId: userId,
        recipientName: clerkUser.fullName || clerkUser.firstName || "A user",
      }
    );

    return NextResponse.json(
      { success: true, message: "Invitation declined successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("PATCH /api/invitations/[id]", error);
  }
}