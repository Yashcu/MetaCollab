"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const config_1 = require("./config/config");
const app_1 = __importDefault(require("./app"));
const socketManager_1 = require("./socketManager");
const PORT = config_1.config.port || 5000;
const httpServer = (0, http_1.createServer)(app_1.default);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});
// Initialize Socket.IO manager
(0, socketManager_1.initializeSocket)(io);
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(config_1.config.mongoURI);
        console.log("✅ MongoDB connected");
    }
    catch (err) {
        console.error("❌ MongoDB connection failed", err);
        process.exit(1);
    }
};
connectDB();
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running in ${config_1.config.nodeEnv} mode on port ${PORT}`);
});
