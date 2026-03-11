import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Invitation } from "@/lib/models/Invitation";
import { Project } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Step 1: Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Await the params
    const { id } = await params;

    // Step 3: Validate the action field
    const body = await req.json();
    const action: unknown = body.action;

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { message: "Invalid action. Must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // Step 4: Connect to DB
    await connectDB();

    // Step 5: Find the invitation
    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return NextResponse.json(
        { message: "Invitation not found" },
        { status: 404 }
      );
    }

    // Step 6: Verify ownership.
    // recipient stores the invitee's EMAIL. We need to fetch the current
    // user's email from Clerk to compare it.
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    if (!userEmail || invitation.recipient !== userEmail) {
      return NextResponse.json(
        { message: "This invitation was not sent to you" },
        { status: 403 }
      );
    }

    // Step 7: Only pending invitations can be acted on
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { message: "This invitation has already been responded to" },
        { status: 400 }
      );
    }

    // Step 8: Handle accept or decline
    if (action === "accept") {
      // Add the user to the project's members array with role "member"
      // Using $push because $addToSet doesn't work well with subdocuments
      const updatedProject = await Project.findByIdAndUpdate(
        invitation.project,
        {
          $push: {
            members: { userId: userId, role: "member" },
          },
        },
        { new: true }
      );

      // Mark invitation as accepted
      invitation.status = "accepted";
      await invitation.save();

      if (updatedProject) {
        // Notify all project members that the project was updated
        await pusherServer.trigger(
          `private-project-${updatedProject._id}`,
          "project:updated",
          updatedProject
        );

        // Broadcast that a new user has joined this project
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

      // Notify the inviter that their invitation was accepted
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

      // Tell the new member's dashboard to refresh
      await pusherServer.trigger(
        `private-user-${userId}`,
        "dashboard:refetch",
        {}
      );

      return NextResponse.json(
        { success: true, message: "Invitation accepted successfully" },
        { status: 200 }
      );
    } else {
      // Decline: just update the status
      invitation.status = "declined";
      await invitation.save();

      const project = await Project.findById(invitation.project).select("name");

      // Notify the inviter their invitation was declined
      await pusherServer.trigger(
        `private-user-${invitation.inviter}`,
        "invitation:declined",
        {
          projectId: invitation.project,
          projectName: project?.name ?? "a project",
          recipientId: userId,
          recipientName: clerkUser.fullName || clerkUser.firstName || "A user",
        }
      );

      return NextResponse.json(
        { success: true, message: "Invitation declined successfully" },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error("[PATCH /api/invitations/[id]] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}