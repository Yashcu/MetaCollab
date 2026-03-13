import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
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

    const body = await req.json();
    const action: unknown = body.action;

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { message: "Invalid action. Must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id },
    });

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

    // Enforce expiry — mark expired and reject with 410 Gone
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { message: "This invitation has expired" },
        { status: 410 }
      );
    }

    if (action === "accept") {
      // Guard against adding the same user twice if they somehow accept twice
      const alreadyMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: invitation.projectId,
            userId,
          },
        },
      });

      if (alreadyMember) {
        await prisma.invitation.update({
          where: { id },
          data: { status: "accepted" },
        });

        return NextResponse.json(
          { success: true, message: "Already a member" },
          { status: 200 }
        );
      }

      const updatedProject = await prisma.project.update({
        where: { id: invitation.projectId },
        data: {
          members: {
            create: {
              userId,
              role: "member",
            },
          },
        },
      });

      await prisma.invitation.update({
        where: { id },
        data: { status: "accepted" },
      });

      if (updatedProject) {
        // Notify existing members the project changed
        await pusherServer.trigger(
          `private-project-${updatedProject.id}`,
          "project:updated",
          updatedProject
        );

        // Announce the new member to the project channel
        await pusherServer.trigger(
          `private-project-${updatedProject.id}`,
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
          projectId: invitation.projectId,
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
    await prisma.invitation.update({
      where: { id },
      data: { status: "declined" },
    });

    await pusherServer.trigger(
      `private-user-${invitation.inviter}`,
      "invitation:declined",
      {
        projectId: invitation.projectId,
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