import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { useSocketStore } from "@/state/socketStore";
import { useChatStore } from "@/state/chatStore";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  projectId: string;
}

const ChatBox = ({ projectId }: Props) => {
  const { user } = useAuth();
  const { messages, sendMessage } = useChatStore();
  const { roomStatus } = useSocketStore();
  const isChatDisabled = roomStatus !== "active";

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isChatDisabled) {
      sendMessage(projectId, input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded shadow p-4">
      <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">
        Project Chat
      </h3>
      <div
        aria-live="polite"
        className="flex-1 overflow-y-auto mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded"
      >
        {messages.map((msg) => (
          <div
            key={`${msg.timestamp}-${msg.user.id}`}
            className={`p-2 rounded-lg mb-2 text-sm max-w-xs ${
              msg.user.id === user?.id
                ? "bg-blue-100 dark:bg-blue-900/50 ml-auto"
                : "bg-gray-200 dark:bg-gray-700/50"
            }`}
          >
            <p className="font-bold text-xs">{msg.user.name}</p>
            <p className="text-gray-800 dark:text-gray-200">{msg.message}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            No messages yet. Say hi!
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          type="text"
          placeholder={
            isChatDisabled
              ? "Waiting for others to join..."
              : "Type a message..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isChatDisabled}
        />
        <Button type="submit" size="icon" disabled={isChatDisabled}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatBox;
