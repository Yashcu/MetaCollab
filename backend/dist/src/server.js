"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const config_1 = require("./config/config");
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./socket");
// Create HTTP server from Express app
const httpServer = (0, http_1.createServer)(app_1.default);
// Initialize Socket.IO with CORS configuration
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: config_1.config.CLIENT_URL,
        methods: ['GET', 'POST'],
    },
});
// Initialize Socket.IO event handlers
(0, socket_1.initializeSocket)(exports.io);
let server;
const gracefulShutdown = async (signal) => {
    console.log(`💤 Received ${signal}. Shutting down gracefully...`);
    if (server) {
        server.close(async () => {
            console.log('HTTP server closed.');
            await mongoose_1.default.disconnect();
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    }
};
// Main Function
const startServer = async () => {
    try {
        await mongoose_1.default.connect(config_1.config.MONGO_URI);
        console.log('MongoDB connected');
        server = httpServer.listen(config_1.config.PORT, () => {
            console.log(`Server running in ${config_1.config.NODE_ENV} mode on port ${config_1.config.PORT}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};
// Start the server
startServer();
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
//# sourceMappingURL=server.js.map