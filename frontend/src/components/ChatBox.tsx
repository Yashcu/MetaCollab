import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { useSocketStore } from "@/state/socketStore";
import { useChatStore } from "@/state/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
}

const ChatMessage = ({ msg, isOwnMessage }: { msg: any; isOwnMessage: boolean }) => (
  <div
    className={cn(
      "p-3 rounded-2xl mb-3 text-sm max-w-[85%] shadow-sm transition-all",
      isOwnMessage
        ? "bg-blue-600 text-white ml-auto rounded-br-none"
        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 mr-auto rounded-bl-none border border-gray-100 dark:border-gray-700"
    )}
  >
    {!isOwnMessage && (
      <p className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-1">
        {msg.user.name}
      </p>
    )}
    <p className="leading-relaxed">{msg.message}</p>
  </div>
);

const ChatInput = ({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-auto pt-4 border-t border-white/10">
      <Input
        type="text"
        placeholder={disabled ? "Waiting for others..." : "Type a message..."}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 rounded-full px-4"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled}
        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 w-10 h-10"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

const ChatBox = ({ projectId }: Props) => {
  const { user } = useAuth();
  const { messages, sendMessage } = useChatStore();
  const { roomStatus, status } = useSocketStore();

  const isOffline = status !== "connected";
  const isAlone = roomStatus === "waiting";
  const isChatDisabled = isOffline; // Only disable if truly offline

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (text: string) => {
    sendMessage(projectId, text);
  };

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOffline ? "bg-red-500" : "bg-green-500 animate-pulse"}`}></span>
          Team Chat
        </h3>
        <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
          {isOffline ? "Offline" : isAlone ? "Waiting" : "Live"}
        </span>
      </div>

      <div
        aria-live="polite"
        className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-2"
      >
        {messages.map((msg) => (
          <ChatMessage
            key={`${msg.timestamp}-${msg.user.id}`}
            msg={msg}
            isOwnMessage={msg.user.id === user?.id}
          />
        ))}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-50">
            <p className="text-sm text-gray-400">No messages yet.</p>
            <p className="text-xs text-gray-500">Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSendMessage} disabled={isChatDisabled} />
    </div>
  );
};

export default ChatBox;
