import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { useSocketStore } from "@/state/socketStore";
import { useAuth } from "@/hooks/useAuth";

// A more specific type for user data coming from sockets
interface SocketUser {
  id: string;
  name: string;
}

interface ChatMessage {
  user: SocketUser;
  message: string;
  timestamp: string;
}

interface Props {
  projectId: string;
}

const ChatBox = ({ projectId }: Props) => {
  const { socket } = useSocketStore();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit("project:join", projectId);

    const handleNewMessage = (newMessage: ChatMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.on("chat:message", handleNewMessage);

    return () => {
      socket.off("chat:message", handleNewMessage);
    };
  }, [socket, projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim() && socket && user) {
      socket.emit("chat:message", {
        projectId,
        message: input,
      });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded shadow p-4">
      <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">
        Project Chat
      </h3>
      <div className="flex-1 overflow-y-auto mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg mb-2 text-sm max-w-xs ${
              msg.user.id === user?.id // Corrected comparison
                ? "bg-blue-100 dark:bg-blue-900/50 ml-auto"
                : "bg-gray-200 dark:bg-gray-700/50"
            }`}
          >
            <p className="font-bold text-xs">{msg.user.name}</p>
            <p className="text-gray-800 dark:text-gray-200">{msg.message}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-500">No messages yet.</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex gap-2"
      >
        <Input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatBox;
