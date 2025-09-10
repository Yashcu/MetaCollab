// src/socket.ts (Final Fix using socket.data)

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/config';
import { UserPayload } from './types/express';
import { Project } from './models/Project';

const events = {
  CONNECTION: 'connection', DISCONNECT: 'disconnect', DISCONNECTING: 'disconnecting',
  JOIN_PROJECT: 'join:project', LEAVE_PROJECT: 'leave:project',
  USER_JOINED: 'user:joined', USER_LEFT: 'user:left',
  ROOM_ACTIVE: 'room:active', ROOM_WAITING: 'room:waiting',
  CHAT_MESSAGE: 'chat:message', CHAT_CLEAR: 'chat:clear',
  CURSOR_MOVE: 'cursor:move', CURSOR_LEAVE: 'cursor:leave',
  CALL_OFFER: 'call:offer', CALL_ANSWER: 'call:answer', CALL_CANDIDATE: 'call:candidate', CALL_END: 'call:end',
};
interface UserInfo { userId: string; userName: string; avatar?: string; }

export const onlineUsers = new Map<string, string>();
const getRoomSize = (io: Server, roomId: string): number => io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

const handleRoomLifecycle = (io: Server, socket: Socket) => {
  const user = socket.data.user; // Use socket.data.user
  const userInfo: UserInfo = { userId: user.userId, userName: user.name };

  socket.on(events.JOIN_PROJECT, async (projectId: string, callback: Function) => {
    const project = await Project.findById(projectId).lean();
    if (!project || !project.members.map(String).includes(user.userId)) {
      return callback?.({ status: 'error', message: 'Access denied' });
    }

    const roomSockets = await io.in(projectId).fetchSockets();
    // FIX: Access the user payload via 's.data.user', which is safe and correct.
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

    callback?.({ status: 'ok', existingUsers });
  });

  socket.on(events.LEAVE_PROJECT, (projectId: string) => socket.leave(projectId));
};

const handleCollaborationEvents = (io: Server, socket: Socket) => {
  const user = socket.data.user; // Use socket.data.user
  // ... (rest of the function is the same, just uses 'user' from above)
  socket.on(events.CHAT_MESSAGE, ({ projectId, text }: { projectId: string, text: string }) => {
    if (getRoomSize(io, projectId) >= 2) {
      io.to(projectId).emit(events.CHAT_MESSAGE, {
        user: { id: user.userId, name: user.name }, message: text, timestamp: new Date().toISOString()
      });
    }
  });

  socket.on(events.CURSOR_MOVE, ({ projectId, x, y }: { projectId: string, x: number, y: number }) => {
    socket.to(projectId).emit(events.CURSOR_MOVE, {
      user: { userId: user.userId, userName: user.name }, position: { x, y }
    });
  });
};

const handleWebRTCSignaling = (io: Server, socket: Socket) => {
  const user = socket.data.user; // Use socket.data.user
  const signalingHandler = (event: string) => ({ to, ...payload }: { to: string;[key: string]: any }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit(event, { ...payload, from: { id: user.userId, name: user.name } });
    }
  };
  socket.on(events.CALL_OFFER, signalingHandler(events.CALL_OFFER));
  socket.on(events.CALL_ANSWER, signalingHandler(events.CALL_ANSWER));
  socket.on(events.CALL_END, signalingHandler(events.CALL_END));
};

export const initializeSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: Token not provided'));
    try {
      // FIX: Attach the user payload to 'socket.data.user'
      socket.data.user = jwt.verify(token, config.JWT_SECRET) as UserPayload;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on(events.CONNECTION, (socket: Socket) => {
    console.log(`✅ User connected: ${socket.data.user.name} (${socket.id})`);
    onlineUsers.set(socket.data.user.userId, socket.id);

    handleRoomLifecycle(io, socket);
    handleCollaborationEvents(io, socket);
    handleWebRTCSignaling(io, socket);

    socket.on(events.DISCONNECTING, () => {
      const user = socket.data.user; // Use socket.data.user
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.to(room).emit(events.USER_LEFT, { userId: user.userId });
          socket.to(room).emit(events.CURSOR_LEAVE, { userId: user.userId });
          if (getRoomSize(io, room) - 1 < 2) {
            socket.to(room).emit(events.ROOM_WAITING);
            socket.to(room).emit(events.CHAT_CLEAR);
            socket.to(room).emit(events.CALL_END, { from: { id: user.userId } });
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
