import express, { Application } from "express";
import morgan from "morgan";
import cors from "cors";
import passport from "passport";
import helmet from "helmet";
import { config } from "./config/config";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import adminRoutes from "./routes/adminRoutes";
import { notFoundHandler, globalErrorHandler } from "./middlewares/errorMiddleware";
import "./config/passport";

const app: Application = express();

// --- Security Middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (config.nodeEnv === "development") app.use(morgan("dev"));
app.use(passport.initialize());

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);

// --- 404 handler ---
app.use(notFoundHandler);

// --- Global error handler ---
app.use(globalErrorHandler);

export default app;
