"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // No need for SignOptions import now
const User_1 = require("../models/User");
const config_1 = require("../config/config");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const appError_1 = require("../utils/appError");
const getExpiryInSeconds = (expiryStr) => {
    const unit = expiryStr.slice(-1);
    const value = parseInt(expiryStr.slice(0, -1), 10);
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return 86400;
    }
};
// Generate JWT token for a user
const generateToken = (user) => {
    const payload = {
        userId: user._id.toString(),
        name: user.name,
        role: user.role,
        email: user.email,
    };
    return jsonwebtoken_1.default.sign(payload, config_1.config.JWT_SECRET, {
        expiresIn: getExpiryInSeconds(config_1.config.JWT_EXPIRES_IN),
    });
};
// --- CONTROLLERS ---
// Signup: create a new user
exports.signup = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { name, email, password } = req.body;
    const user = await User_1.User.create({
        name,
        email,
        password,
    });
    const existingUser = await User_1.User.findOne({ email });
    if (existingUser) {
        return next(new appError_1.AppError('An account with that email already exists.', 400));
    }
    const token = generateToken(user);
    (0, apiResponse_1.sendSuccess)(res, { token, user }, "User created successfully", 201);
});
// Login: validate credentials, return JWT token
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new appError_1.AppError("Please provide email and password", 400));
    }
    const user = await User_1.User.findOne({ email }).select('+password');
    if (!user || !(await bcryptjs_1.default.compare(password, user.password || ''))) {
        return next(new appError_1.AppError("Invalid email or password", 401));
    }
    const token = generateToken(user);
    (0, apiResponse_1.sendSuccess)(res, { token, user }, "Login successful");
});
//# sourceMappingURL=authController.js.map