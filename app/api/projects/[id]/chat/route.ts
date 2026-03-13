import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { requireAuth, serverError } from "@/lib/api";
import crypto from "crypto";

export const runtime = "nodejs";

// Broadcast a chat message to all project members via Pusher
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, error } = await requireAuth();
        if (error) return error;

        const { id } = await params;

        const body = await req.json();
        const { message } = body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return NextResponse.json({ message: "Message is required" }, { status: 400 });
        }

        if (message.length > 2000) {
            return NextResponse.json(
                { message: "Message cannot exceed 2000 characters" },
                { status: 400 }
            );
        }

        // Deny if the sender isn't a project owner or member
        const project = await prisma.project.findFirst({
            where: {
                id,
                OR: [
                    { owner: userId },
                    { members: { some: { userId } } }
                ]
            }
        });

        if (!project) {
            return NextResponse.json({ message: "Project not found or access denied" }, { status: 403 });
        }

        // Resolve the sender's display name from Clerk — never trust client-supplied identity
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        await pusherServer.trigger(`private-project-${id}`, "chat:message", {
            id: crypto.randomUUID(),
            userId,
            userName: clerkUser.fullName ?? clerkUser.firstName ?? "Anonymous",
            avatarUrl: clerkUser.imageUrl ?? null,
            message: message.trim(),
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: unknown) {
        return serverError("POST /api/projects/[id]/chat", error);
    }
}
