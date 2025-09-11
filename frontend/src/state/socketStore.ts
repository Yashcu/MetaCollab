import { create } from "zustand";
import io, { Socket } from "socket.io-client";
import { useAuthStore } from "./authStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

interface ProjectUser {
  userId: string;
  userName: string;
  avatar?: string;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected";
type RoomStatus = "active" | "waiting" | "idle";

interface SocketState {
  socket: Socket | null;
  status: ConnectionStatus;
  roomStatus: RoomStatus;
  projectUsers: ProjectUser[];
  lastJoinedProjectId: string | null;
  connect: () => void;
  disconnect: () => void;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  status: "idle",
  roomStatus: "idle",
  projectUsers: [],
  lastJoinedProjectId: null,

  connect: () => {
    if (get().socket) return;

    const { token } = useAuthStore.getState();
    if (!token) {
      return console.error("Socket connection failed: No auth token.");
    }

    set({ status: "connecting" });
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      set({ status: "connected" });
      console.log("✅ Socket connected:", newSocket.id);

      const lastJoining = get().lastJoinedProjectId;
      if (lastJoining) {
        get().joinProject(lastJoining);
      }
    });

    newSocket.on("disconnect", () => {
      set({ status: "disconnected", roomStatus: "idle", projectUsers: [] });
      console.log("🔥 Socket disconnected.");
    });

    newSocket.on("room:active", () => set({ roomStatus: "active" }));
    newSocket.on("room:waiting", () => set({ roomStatus: "waiting" }));

    newSocket.on("user:joined", (user: ProjectUser) => {
      set((state) => ({ projectUsers: [...state.projectUsers, user] }));
    });

    newSocket.on("user:left", ({ userId }: { userId: string }) => {
      set((state) => ({
        projectUsers: state.projectUsers.filter((p) => p.userId !== userId),
      }));
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, status: "idle", roomStatus: "idle", projectUsers: [] });
  },

  joinProject: (projectId) => {
    get().socket?.emit(
      "join:project",
      projectId,
      (response: { status: string; existingUsers: ProjectUser[] }) => {
        if (response.status === "ok") {
          set({ projectUsers: response.existingUsers });
        }
      }
    );
    set({ lastJoinedProjectId: projectId });
  },

  leaveProject: (projectId) => {
    get().socket?.emit("leave:project", projectId);
    set({ roomStatus: "idle", projectUsers: [] });
  },
}));
