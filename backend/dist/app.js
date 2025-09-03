"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const config_1 = require("./config/config");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const leaderboardRoutes_1 = __importDefault(require("./routes/leaderboardRoutes")); // <-- Import the new routes
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
require("./config/passport");
const app = (0, express_1.default)();
// --- Middleware ---
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (config_1.config.nodeEnv === "development")
    app.use((0, morgan_1.default)("dev"));
app.use(passport_1.default.initialize());
// --- Routes ---
app.use("/api/auth", authRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/projects", projectRoutes_1.default);
app.use("/api/leaderboard", leaderboardRoutes_1.default); // <-- Use the new routes
app.use("/api/tasks", taskRoutes_1.default);
// --- 404 handler ---
app.use(errorMiddleware_1.notFoundHandler);
// --- Global error handler ---
app.use(errorMiddleware_1.globalErrorHandler);
exports.default = app;
