import { create } from "zustand";
import io, { Socket } from "socket.io-client";
import { useAuthStore } from "./authStore";

const SOCKET_URL = "http://localhost:5000";

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connect: () => void;
  disconnect: () => void;
  setOnlineUsers: (users: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connect: () => {
    const { token } = useAuthStore.getState();
    if (token && !get().socket) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token,
        },
      });

      newSocket.on("connect", () => {
        set({ socket: newSocket });
        console.log("✅ Socket connected");
      });

      newSocket.on("users:online", (users: string[]) => {
        get().setOnlineUsers(users);
      });

      // Listen for 'id' property from the backend event payload
      newSocket.on("user:online", (data: { id: string }) => {
        get().addOnlineUser(data.id);
      });

      // Listen for 'id' property from the backend event payload
      newSocket.on("user:offline", (data: { id: string }) => {
        get().removeOnlineUser(data.id);
      });

      newSocket.on("disconnect", () => {
        set({ socket: null, onlineUsers: [] });
        console.log("🔥 Socket disconnected");
      });
    }
  },

  disconnect: () => {
    get().socket?.disconnect();
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: [...new Set([...state.onlineUsers, userId])],
    })),
  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    })),
}));
