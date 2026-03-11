"use client";

import { useParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
    const params = useParams();
    const projectId = params.id as string;

    return (
        <div className="h-full bg-[#070b14]">
            <ChatWindow projectId={projectId} />
        </div>
    );
}