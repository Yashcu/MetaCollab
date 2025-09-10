import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/config';
import app from './app';
import { initializeSocket } from './socket';

const httpServer = http.createServer(app);

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

initializeSocket(io);

let server: http.Server;

const gracefulShutdown = (signal: string) => {
  console.log(`💤 Received ${signal}. Shutting down gracefully...`);
  io.close(() => {
    console.log('Socket.IO server closed.');
    if (server) {
      server.close(async () => {
        console.log('HTTP server closed.');
        await mongoose.disconnect();
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    }
  });
};

const startServer = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('MongoDB connected');

    server = httpServer.listen(config.PORT, () => {
      console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason: Error) => {
  console.error('💥 Unhandled Rejection. Shutting down...', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err: Error) => {
  console.error('💥 Uncaught Exception. Shutting down...', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
