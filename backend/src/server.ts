import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./config/config";
import app from "./app";
import { initializeSocket } from "./socketManager";

const PORT = config.port || 5000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Initialize Socket.IO manager
initializeSocket(io);

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
    process.exit(1);
  }
};

connectDB();

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
});
