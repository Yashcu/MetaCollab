"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = exports.onlineUsers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config/config");
const Project_1 = require("./models/Project");
// --- Event Constants (as per your spec) ---
const events = {
    // Connection & Room Management
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    DISCONNECTING: 'disconnecting',
    JOIN_PROJECT: 'join:project',
    LEAVE_PROJECT: 'leave:project',
    // Room State & User Notifications
    USER_JOINED: 'user:joined',
    USER_LEFT: 'user:left',
    ROOM_ACTIVE: 'room:active', // When collaboration can begin (>= 2 users)
    ROOM_WAITING: 'room:waiting', // When a user is alone
    // Ephemeral Chat
    CHAT_MESSAGE: 'chat:message',
    CHAT_CLEAR: 'chat:clear',
    // Mouse Tracking
    CURSOR_MOVE: 'cursor:move',
    CURSOR_LEAVE: 'cursor:leave',
    // Kanban/Task Sync
    TASK_CREATE: 'task:create',
    TASK_UPDATE: 'task:update',
    TASK_DELETE: 'task:delete',
    // WebRTC Signaling
    CALL_OFFER: 'call:offer',
    CALL_ANSWER: 'call:answer',
    CALL_CANDIDATE: 'call:candidate',
    CALL_END: 'call:end',
};
// Map to find a user's socket for direct messaging (signaling)
exports.onlineUsers = new Map();
// --- Helper: Get Room Size ---
const getRoomSize = (io, roomId) => {
    return io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
};
// --- Event Handlers ---
/**
 * Handles all logic for a user connecting, joining, and leaving a project room.
 */
const handleRoomLifecycle = (io, socket) => {
    const user = socket.user;
    const userInfo = {
        userId: user.userId,
        userName: user.name,
        // avatar: user.avatarUrl // Assuming avatar is in payload
    };
    socket.on(events.JOIN_PROJECT, async ({ projectId }, callback) => {
        // 1. Authorize: Check if user is a member of the project
        const project = await Project_1.Project.findById(projectId).lean();
        if (!project || !project.members.map(String).includes(user.userId)) {
            return callback?.({ status: 'error', message: 'Access denied' });
        }
        // 2. Join the Socket.IO room
        await socket.join(projectId);
        const membersCount = getRoomSize(io, projectId);
        // 3. Notify others in the room
        socket.to(projectId).emit(events.USER_JOINED, { ...userInfo, membersCount });
        // 4. Implement the "Room Lifecycle" logic
        if (membersCount >= 2) {
            // The room is now active for everyone
            io.to(projectId).emit(events.ROOM_ACTIVE);
        }
        else {
            // The user is alone and waiting
            socket.emit(events.ROOM_WAITING);
        }
        callback?.({ status: 'ok', membersCount });
    });
    socket.on(events.LEAVE_PROJECT, ({ projectId }) => {
        socket.leave(projectId);
        const membersCount = getRoomSize(io, projectId);
        // Manually trigger the same logic as disconnect
        io.to(projectId).emit(events.USER_LEFT, { userId: user.userId, membersCount });
        if (membersCount < 2) {
            io.to(projectId).emit(events.ROOM_WAITING);
            io.to(projectId).emit(events.CHAT_CLEAR);
        }
    });
};
/**
 * Handles features that are only active when roomSize >= 2
 */
const handleCollaborationEvents = (io, socket) => {
    const user = socket.user;
    const userInfo = {
        userId: user.userId,
        userName: user.name,
        avatar: user.avatarUrl
    };
    // Chat
    socket.on(events.CHAT_MESSAGE, ({ projectId, text }) => {
        if (getRoomSize(io, projectId) >= 2) {
            io.to(projectId).emit(events.CHAT_MESSAGE, {
                user: { id: userInfo.userId, name: userInfo.userName },
                message: text,
                timestamp: new Date().toISOString()
            });
        }
    });
    // Mouse Tracking
    socket.on(events.CURSOR_MOVE, ({ projectId, x, y }) => {
        socket.to(projectId).emit(events.CURSOR_MOVE, {
            user: { userId: userInfo.userId, userName: userInfo.userName },
            position: { x, y }
        });
    });
    // Task Syncing
    socket.on(events.TASK_CREATE, (payload) => {
        if (getRoomSize(io, payload.projectId) >= 2) {
            // Broadcast to others, including the original sender's user info
            socket.to(payload.projectId).emit(events.TASK_CREATE, { ...payload, from: user });
        }
    });
    socket.on(events.TASK_UPDATE, (payload) => {
        if (getRoomSize(io, payload.projectId) >= 2) {
            socket.to(payload.projectId).emit(events.TASK_UPDATE, { ...payload, from: user });
        }
    });
    socket.on(events.TASK_DELETE, (payload) => {
        if (getRoomSize(io, payload.projectId) >= 2) {
            socket.to(payload.projectId).emit(events.TASK_DELETE, { ...payload, from: user });
        }
    });
};
/**
 * Handles forwarding of WebRTC signaling messages.
 */
const handleWebRTCSignaling = (io, socket) => {
    const signalingHandler = (event) => ({ to, ...payload }) => {
        const targetSocketId = exports.onlineUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit(event, payload);
        }
    };
    socket.on(events.CALL_OFFER, signalingHandler(events.CALL_OFFER));
    socket.on(events.CALL_ANSWER, signalingHandler(events.CALL_ANSWER));
    socket.on(events.CALL_CANDIDATE, signalingHandler(events.CALL_CANDIDATE));
};
// --- Main Socket Initialization ---
const initializeSocket = (io) => {
    // Middleware for JWT authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error('Authentication error: Token not provided'));
        try {
            socket.user = jsonwebtoken_1.default.verify(token, config_1.config.JWT_SECRET);
            next();
        }
        catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on(events.CONNECTION, (socket) => {
        if (!socket.user)
            return socket.disconnect(true);
        console.log(`✅ User connected: ${socket.user.name} (${socket.id})`);
        exports.onlineUsers.set(socket.user.userId, socket.id);
        // Register handlers
        handleRoomLifecycle(io, socket);
        handleCollaborationEvents(io, socket);
        handleWebRTCSignaling(io, socket);
        // Critical: Handle disconnect logic to update room states
        socket.on(events.DISCONNECTING, () => {
            const user = socket.user;
            // Rooms the user is about to leave
            socket.rooms.forEach(room => {
                if (room !== socket.id) { // Exclude the socket's own room
                    const membersCount = getRoomSize(io, room) - 1;
                    // Notify room members that this user has left
                    socket.to(room).emit(events.USER_LEFT, { userId: user.userId, membersCount });
                    socket.to(room).emit(events.CURSOR_LEAVE, { userId: user.userId });
                    // If the room becomes inactive
                    if (membersCount < 2) {
                        socket.to(room).emit(events.ROOM_WAITING);
                        socket.to(room).emit(events.CHAT_CLEAR);
                        socket.to(room).emit(events.CALL_END, { userId: user.userId });
                    }
                }
            });
        });
        socket.on(events.DISCONNECT, () => {
            console.log(`🔥 User disconnected: ${socket.user.name} (${socket.id})`);
            exports.onlineUsers.delete(socket.user.userId);
        });
    });
};
exports.initializeSocket = initializeSocket;
//# sourceMappingURL=socket.js.map