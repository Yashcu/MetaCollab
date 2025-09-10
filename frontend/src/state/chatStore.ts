import { create } from 'zustand';
import { useSocketStore } from './socketStore';
import { toast } from '@/components/ui/use-toast';

interface ChatMessage {
  user: { id: string; name: string };
  message: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  sendMessage: (projectId: string, text: string) => void;
  init: () => void;
  cleanup: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (newMessage) => {
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },
  clearMessages: () => {
    set({ messages: [] });
  },
  sendMessage: (projectId, text) => {
    const { socket, roomStatus } = useSocketStore.getState();
    if (socket && roomStatus === 'active') {
      socket.emit('chat:message', { projectId, text });
    } else {
      toast({
        variant: 'destructive',
        description: "You can't send messages when you're alone.",
      });
    }
  },

  init: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    socket.on('chat:message', (message: ChatMessage) => {
      set((state) => ({ messages: [...state.messages, message] }));
    });

    socket.on('chat:clear', () => {
      set({ messages: [] });
      toast({ description: 'The chat has been cleared as you are now the only one here.' });
    });
  },

  cleanup: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    socket.off('chat:message');
    socket.off('chat:clear');
  },
}));
