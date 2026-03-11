import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Invitation } from "@/lib/models/Invitation";
import { Project } from "@/lib/models/Project";
import type { IProjectMember } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";
import { invitationSchema } from "@/lib/validations";
import { requireAuth, validationError, serverError } from "@/lib/api";

export const runtime = "nodejs";

// Get all pending invitations for the current user
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Resolve the user's primary email from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json(
        { message: "Could not determine user email" },
        { status: 400 }
      );
    }

    await connectDB();

    const invitations = await Invitation.find({
      recipient: userEmail,
      status: "pending",
    }).select("-__v").lean();

    return NextResponse.json(
      {
        success: true,
        data: invitations,
        message: "Invitations fetched successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return serverError("GET /api/invitations", error);
  }
}

// Send a project invitation — only the project owner can invite
export async function POST(req: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const parsed = invitationSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { projectId } = parsed.data;
    const recipientEmail = parsed.data.email.toLowerCase().trim();

    await connectDB();

    // Confirm the requester owns this project
    const project = await Project.findOne(
      { _id: projectId, owner: userId },
      { members: 1 }
    );

    if (!project) {
      return NextResponse.json(
        { message: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // Check if the recipient already has an account and is a member
    const client = await clerkClient();

    // Prevent the owner from inviting themselves
    const senderUser = await client.users.getUser(userId);
    const senderEmail = senderUser.emailAddresses[0]?.emailAddress?.toLowerCase();

    if (senderEmail && senderEmail === recipientEmail) {
      return NextResponse.json(
        { message: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    const existingUsers = await client.users.getUserList({
      emailAddress: [recipientEmail],
    });

    const recipientClerkUser = existingUsers.data[0];

    if (recipientClerkUser) {
      const isAlreadyMember = project.members.some(
        (m: IProjectMember) => m.userId === recipientClerkUser.id
      );

      if (isAlreadyMember) {
        return NextResponse.json(
          { message: "This user is already a member of the project" },
          { status: 400 }
        );
      }
    }

    // Prevent duplicate pending invitations to the same email
    const existingInvite = await Invitation.findOne({
      project: projectId,
      recipient: recipientEmail,
      status: "pending",
    });

    if (existingInvite) {
      return NextResponse.json(
        { message: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }

    const invite = await Invitation.create({
      project: projectId,
      inviter: userId,
      recipient: recipientEmail,
    });

    // Real-time notification — only fires if recipient already has an account
    if (recipientClerkUser) {
      await pusherServer.trigger(
        `private-user-${recipientClerkUser.id}`,
        "invitation:new",
        invite
      );
    }

    return NextResponse.json(
      { success: true, data: invite, message: "Invitation sent successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    return serverError("POST /api/invitations", error);
  }
}