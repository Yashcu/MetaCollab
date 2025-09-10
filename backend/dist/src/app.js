"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const xss = require('xss-clean');
const compression_1 = __importDefault(require("compression"));
const config_1 = require("./config/config");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const invitationRoutes_1 = __importDefault(require("./routes/invitationRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const app = (0, express_1.default)();
// --- Security & Core Middleware ---
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.CLIENT_URL,
}));
// REASON: A strict rate limiter for authentication routes. This must come BEFORE the general limiter.
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);
// REASON: A general rate limiter for all other API routes.
const generalApiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', generalApiLimiter);
// Body parsers, sanitizers, compression, etc.
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
app.use((0, express_mongo_sanitize_1.default)());
app.use(xss());
app.use((0, compression_1.default)());
if (config_1.config.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// --- Routes ---
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/invitations', invitationRoutes_1.default);
app.use('/api/projects/:projectId/tasks', taskRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// --- Error Handlers ---
app.use(errorMiddleware_1.notFoundHandler);
app.use(errorMiddleware_1.globalErrorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map