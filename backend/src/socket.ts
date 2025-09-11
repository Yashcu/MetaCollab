import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "./config/config";
import { UserPayload } from "./types/express";
import { Project } from "./models/Project";

const events = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  DISCONNECTING: "disconnecting",
  JOIN_PROJECT: "join:project",
  LEAVE_PROJECT: "leave:project",
  USER_JOINED: "user:joined",
  USER_LEFT: "user:left",
  ROOM_ACTIVE: "room:active",
  ROOM_WAITING: "room:waiting",
  CHAT_MESSAGE: "chat:message",
  CHAT_CLEAR: "chat:clear",
  CURSOR_MOVE: "cursor:move",
  CURSOR_LEAVE: "cursor:leave",
  CALL_OFFER: "call:offer",
  CALL_ANSWER: "call:answer",
  CALL_CANDIDATE: "call:candidate",
  CALL_END: "call:end",
};

interface UserInfo {
  userId: string;
  userName: string;
  avatar?: string;
}

// Cursor throttling
const recentCursorEvents = new Map<string, number>();
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of recentCursorEvents) {
    if (now - ts > 5000) recentCursorEvents.delete(key);
  }
}, 5000);

// Presence maps
export const onlineUsers = new Map<string, string>();
const activeCalls = new Map<string, Set<string>>();

const getRoomSize = (io: Server, roomId: string): number =>
  io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

const isProjectMember = async (projectId: string, userId: string) => {
  const project = await Project.findOne({ _id: projectId, members: userId }).lean();
  return !!project;
};

// --- Room lifecycle ---
const handleRoomLifecycle = (io: Server, socket: Socket) => {
  const user = socket.data.user;
  const userInfo: UserInfo = { userId: user.userId, userName: user.name };

  socket.on(events.JOIN_PROJECT, async (projectId: string, callback: Function) => {
    if (!(await isProjectMember(projectId, user.userId))) {
      return callback?.({ status: "error", message: "Access denied" });
    }

    const roomSockets = await io.in(projectId).fetchSockets();
    const existingUsers = roomSockets.map((s) => ({
      userId: s.data.user.userId,
      userName: s.data.user.name,
    }));

    await socket.join(projectId);
    socket.to(projectId).emit(events.USER_JOINED, userInfo);

    if (getRoomSize(io, projectId) >= 2) {
      io.to(projectId).emit(events.ROOM_ACTIVE);
    } else {
      socket.emit(events.ROOM_WAITING);
    }

    callback?.({ status: "ok", existingUsers });
  });

  socket.on(events.LEAVE_PROJECT, (projectId: string) => socket.leave(projectId));
};

// --- Collaboration events ---
const handleCollaborationEvents = (io: Server, socket: Socket) => {
  const user = socket.data.user;

  socket.on(events.CHAT_MESSAGE, async ({ projectId, text }) => {
    if (!(await isProjectMember(projectId, user.userId))) return;

    if (getRoomSize(io, projectId) >= 2) {
      io.to(projectId).emit(events.CHAT_MESSAGE, {
        user: { id: user.userId, name: user.name },
        message: text,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on(events.CURSOR_MOVE, async ({ projectId, x, y }) => {
    if (!(await isProjectMember(projectId, user.userId))) return;

    const eventKey = `${projectId}-${user.userId}`;
    const now = Date.now();
    if (recentCursorEvents.get(eventKey) && now - recentCursorEvents.get(eventKey)! < 80)
      return;

    recentCursorEvents.set(eventKey, now);

    socket.to(projectId).emit(events.CURSOR_MOVE, {
      user: { userId: user.userId, userName: user.name },
      position: { x, y },
    });
  });
};

// --- WebRTC signaling ---
const handleWebRTCSignaling = (io: Server, socket: Socket) => {
  const user = socket.data.user;

  const signalingHandler =
    (event: string) =>
    async ({ to, projectId, ...payload }: { to: string; projectId: string; [key: string]: any }) => {
      if (!(await isProjectMember(projectId, user.userId))) return;

      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit(event, {
          ...payload,
          from: { id: user.userId, name: user.name },
        });
      }

      // Track calls
      if (event === events.CALL_OFFER) {
        if (!activeCalls.has(projectId)) activeCalls.set(projectId, new Set());
        activeCalls.get(projectId)!.add(user.userId);
        activeCalls.get(projectId)!.add(to);
      } else if (event === events.CALL_END) {
        activeCalls.get(projectId)?.delete(user.userId);
      }
    };

  socket.on(events.CALL_OFFER, signalingHandler(events.CALL_OFFER));
  socket.on(events.CALL_ANSWER, signalingHandler(events.CALL_ANSWER));
  socket.on(events.CALL_END, signalingHandler(events.CALL_END));
};

// --- Initialize socket ---
export const initializeSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: Token not provided"));
    try {
      socket.data.user = jwt.verify(token, config.JWT_SECRET) as UserPayload;
      next();
    } catch {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on(events.CONNECTION, (socket: Socket) => {
    console.log(`✅ User connected: ${socket.data.user.name} (${socket.id})`);
    onlineUsers.set(socket.data.user.userId, socket.id);

    handleRoomLifecycle(io, socket);
    handleCollaborationEvents(io, socket);
    handleWebRTCSignaling(io, socket);

    socket.on(events.DISCONNECTING, () => {
      const user = socket.data.user;
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit(events.USER_LEFT, { userId: user.userId });
          socket.to(room).emit(events.CURSOR_LEAVE, { userId: user.userId });

          if (getRoomSize(io, room) - 1 < 2) {
            socket.to(room).emit(events.ROOM_WAITING);
            socket.to(room).emit(events.CHAT_CLEAR);

            if (activeCalls.get(room)?.has(user.userId)) {
              socket.to(room).emit(events.CALL_END, { from: { id: user.userId } });
              activeCalls.get(room)?.delete(user.userId);
            }
          }
        }
      });
    });

    socket.on(events.DISCONNECT, () => {
      console.log(`🔥 User disconnected: ${socket.data.user.name} (${socket.id})`);
      onlineUsers.delete(socket.data.user.userId);
    });
  });
};
