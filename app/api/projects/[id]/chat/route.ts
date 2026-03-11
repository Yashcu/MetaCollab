import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { pusherServer } from "@/lib/pusher";
import mongoose from "mongoose";

export const runtime = "nodejs";

function isValidObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ message: "Invalid project ID" }, { status: 400 });
        }

        const body = await req.json();
        const { id: msgId, user, message, timestamp } = body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return NextResponse.json({ message: "Message is required" }, { status: 400 });
        }

        await connectDB();

        // Verify sender is a member of this project
        const project = await Project.findOne({
            _id: id,
            "members.userId": userId,
        });

        if (!project) {
            return NextResponse.json({ message: "Project not found or access denied" }, { status: 404 });
        }

        // Broadcast to all project members via Pusher
        await pusherServer.trigger(`private-project-${id}`, "chat:message", {
            id: msgId ?? crypto.randomUUID(),
            user,
            message: message.trim(),
            timestamp: timestamp ?? new Date().toISOString(),
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: unknown) {
        console.error("[POST /api/projects/[id]/chat] error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}