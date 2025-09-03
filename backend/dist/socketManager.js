"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config/config");
// In-memory store for online users and their socket IDs
const onlineUsers = new Map();
/**
 * Helper function to broadcast the updated list of online user IDs to ALL clients.
 * This is the source of truth for "who is online".
 * @param io The Socket.IO server instance.
 */
const broadcastOnlineUsers = (io) => {
    const userList = Array.from(onlineUsers.keys());
    io.emit("users:online", userList);
    console.log("Broadcasting online users:", userList); // For server-side debugging
};
const initializeSocket = (io) => {
    console.log("🔌 Initializing Socket.IO manager...");
    /**
     * Middleware for authenticating socket connections.
     * This runs for every new connection attempt before the 'connection' event is fired.
     */
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.error("❌ Socket Auth Error: Connection rejected. Token not provided.");
            return next(new Error("Authentication error: Token not provided."));
        }
        try {
            // Verify the token from the client
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
            // Attach user information to the socket object for use in other event handlers
            socket.user = { id: decoded.userId, name: decoded.name };
            console.log(`✅ Socket Auth Success for user: ${decoded.name}`);
            next(); // Token is valid, proceed with the connection
        }
        catch (err) {
            console.error("❌ Socket Auth Error: Connection rejected. Token is invalid or expired.");
            return next(new Error("Authentication error: Token is invalid."));
        }
    });
    /**
     * Main handler for when a client successfully connects after authentication.
     */
    io.on("connection", (socket) => {
        const user = socket.user;
        // Guard against connections that somehow bypass the user attachment
        if (!user) {
            console.error("A socket connected without user data. Disconnecting.");
            socket.disconnect();
            return;
        }
        console.log(`⚡: ${user.name} (${user.id}) connected with socket ID ${socket.id}`);
        onlineUsers.set(user.id, { name: user.name, socketId: socket.id });
        // Notify all clients about the updated list of online users
        broadcastOnlineUsers(io);
        // Notify all *other* clients that a new user has come online for the toast message
        socket.broadcast.emit("user:online", { id: user.id, name: user.name });
        // --- Room and Event Listeners ---
        socket.on("project:join", (projectId) => {
            socket.join(projectId);
            console.log(`🚪 ${user.name} joined project room: ${projectId}`);
        });
        socket.on("chat:message", (data) => {
            io.to(data.projectId).emit("chat:message", {
                user,
                message: data.message,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on("task:update", (data) => {
            socket.to(data.projectId).emit("task:update", data.tasks);
        });
        socket.on("cursor:move", (data) => {
            socket.to(data.projectId).emit("cursor:move", {
                user,
                position: data.position,
            });
        });
        // --- WebRTC Signaling ---
        socket.on("call:user", (data) => {
            const toSocketId = onlineUsers.get(data.to)?.socketId;
            if (toSocketId) {
                io.to(toSocketId).emit("call:incoming", {
                    signal: data.signal,
                    from: data.from,
                });
            }
        });
        socket.on("call:accepted", (data) => {
            const toSocketId = onlineUsers.get(data.to.id)?.socketId;
            if (toSocketId) {
                io.to(toSocketId).emit("call:accepted", data.signal);
            }
        });
        // --- Disconnect Handler ---
        socket.on("disconnect", () => {
            console.log(`🔥: ${user.name} disconnected`);
            onlineUsers.delete(user.id);
            // Notify all clients about the updated list of online users
            broadcastOnlineUsers(io);
            // Notify all clients that this user has gone offline for the toast message
            io.emit("user:offline", { id: user.id, name: user.name });
        });
    });
};
exports.initializeSocket = initializeSocket;
