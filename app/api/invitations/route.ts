import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { invitationSchema } from "@/lib/validations";
import { requireAuth, validationError, serverError, validateJsonContentType } from "@/lib/api";

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

    const invitations = await prisma.invitation.findMany({
      where: {
        recipient: userEmail,
        status: "pending",
      },
    });

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

    // Reject non-JSON bodies early
    const contentTypeError = validateJsonContentType(req);
    if (contentTypeError) return contentTypeError;

    const body = await req.json();
    const parsed = invitationSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { projectId } = parsed.data;
    const recipientEmail = parsed.data.email.toLowerCase().trim();

    // Confirm the requester owns this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project || project.owner !== userId) {
      return NextResponse.json(
        { message: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    const client = await clerkClient();

    // Parallelize both Clerk calls — they are independent, no need to await serially
    const [senderUser, existingUsers] = await Promise.all([
      client.users.getUser(userId),
      client.users.getUserList({ emailAddress: [recipientEmail] }),
    ]);

    // Prevent the owner from inviting themselves
    const senderEmail = senderUser.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (senderEmail && senderEmail === recipientEmail) {
      return NextResponse.json(
        { message: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    const recipientClerkUser = existingUsers.data[0];

    if (recipientClerkUser) {
      const isAlreadyMember = project.members.some(
        (m: any) => m.userId === recipientClerkUser.id
      );

      if (isAlreadyMember) {
        return NextResponse.json(
          { message: "This user is already a member of the project" },
          { status: 400 }
        );
      }
    }

    // Prevent duplicate pending invitations to the same email
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        projectId,
        recipient: recipientEmail,
        status: "pending",
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { message: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }

    const invite = await prisma.invitation.create({
      data: {
        projectId,
        inviter: userId,
        recipient: recipientEmail,
        token: crypto.randomBytes(32).toString("hex"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
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