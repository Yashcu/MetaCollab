import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth, serverError } from "@/lib/api";

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

        if (!isValidObjectId(id)) {
            return NextResponse.json({ message: "Invalid project ID" }, { status: 400 });
        }

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

        await connectDB();

        // Deny if the sender isn't a project member
        // exists() avoids loading the full document — we only need a boolean here
        const isMember = await Project.exists({
            _id: id,
            "members.userId": userId,
        });

        if (!isMember) {
            return NextResponse.json({ message: "Project not found or access denied" }, { status: 403 });
        }

        // build user object from auth — never trust client-supplied identity
        await pusherServer.trigger(`private-project-${id}`, "chat:message", {
            id: crypto.randomUUID(),
            userId,
            message: message.trim(),
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: unknown) {
        return serverError("POST /api/projects/[id]/chat", error);
    }
}
