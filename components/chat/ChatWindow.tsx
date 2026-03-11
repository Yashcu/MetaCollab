"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/store/chatStore";
import { usePusher } from "@/components/realtime/usePusher";
import type { ChatMessage } from "@/store/chatStore";

interface ChatWindowProps {
    projectId: string;
}

export function ChatWindow({ projectId }: ChatWindowProps) {
    const { user } = useUser();
    const { messages, addMessage, clearMessages } = useChatStore();
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const channelName = `private-project-${projectId}`;

    // Clear messages when switching projects
    useEffect(() => {
        clearMessages();
    }, [projectId, clearMessages]);

    // Listen for incoming chat messages via Pusher
    usePusher<ChatMessage>(channelName, "chat:message", (data) => {
        addMessage(data);
    });

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || !user || isSending) return;

        const message: ChatMessage = {
            id: crypto.randomUUID(),
            user: { id: user.id, name: user.fullName ?? user.firstName ?? "User" },
            message: input.trim(),
            timestamp: new Date().toISOString(),
        };

        setIsSending(true);
        setInput("");

        try {
            // Add optimistically — server will broadcast to everyone including sender
            addMessage(message);

            await fetch(`/api/projects/${projectId}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(message),
            });
        } catch {
            // Message already shown optimistically — leave it as is
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-white/20 text-sm">
                        <p>No messages yet.</p>
                        <p className="text-xs mt-1">Start the conversation 👇</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.user.id === user?.id;
                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                        >
                            {/* Avatar */}
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400/40 to-violet-500/40 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                                {msg.user.name[0]?.toUpperCase()}
                            </div>

                            <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    {!isMe && (
                                        <span className="text-white/40 text-xs font-medium">{msg.user.name}</span>
                                    )}
                                    <span className="text-white/15 text-[10px]">
                                        {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>

                                <div
                                    className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${isMe
                                            ? "bg-cyan-400/15 text-cyan-100 rounded-tr-sm"
                                            : "bg-white/[0.06] text-white/80 rounded-tl-sm"
                                        }`}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 pb-5 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Type a message..."
                        className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-400/40 focus:ring-0"
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || isSending}
                        size="sm"
                        className="h-10 w-10 p-0 bg-cyan-400 hover:bg-cyan-300 text-[#070b14] shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}