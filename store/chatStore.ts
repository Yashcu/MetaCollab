import { create } from "zustand";

export interface ChatMessage {
  id: string;
  user: { id: string; name: string };
  message: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],

  addMessage: (newMessage) => {
    const alreadyExists = get().messages.some((m) => m.id === newMessage.id);
    if (alreadyExists) return;

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  clearMessages: () => set({ messages: [] }),

  reset: () => set({ messages: [] }),
}));