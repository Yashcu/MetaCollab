import { create } from "zustand";

export interface ChatMessage {
  id: string;
  // Fields injected by the server — never trust client-supplied identity
  userId: string;
  userName: string;
  avatarUrl?: string;
  message: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  /**
   * Plain string array instead of Set — Zustand uses shallow equality,
   * so a Set mutation is invisible to subscribers.
   */
  messageIds: string[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  messageIds: [],

  addMessage: (newMessage) => {
    // O(1) average via includes — fine for typical chat volumes (<1000 msgs)
    if (get().messageIds.includes(newMessage.id)) return;

    set((state) => ({
      messages: [...state.messages, newMessage],
      messageIds: [...state.messageIds, newMessage.id],
    }));
  },

  clearMessages: () => set({ messages: [], messageIds: [] }),
  reset: () => set({ messages: [], messageIds: [] }),
}));