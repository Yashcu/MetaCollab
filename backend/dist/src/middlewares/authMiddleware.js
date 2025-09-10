"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const apiResponse_1 = require("../utils/apiResponse");
const User_1 = require("@/models/User");
// authMiddleware.ts - protect routes using JWT
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return (0, apiResponse_1.sendError)(res, "Not authorized, no token", 401);
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.JWT_SECRET);
        const currentUser = await User_1.User.findById(decoded.userId);
        if (!currentUser) {
            return (0, apiResponse_1.sendError)(res, "The user belonging to this token no longer exists.", 401);
            return (0, apiResponse_1.sendError)(res, "The user belonging to this token no longer exists.", 401);
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        return (0, apiResponse_1.sendError)(res, "Token invalid or expired", 401);
    }
};
exports.protect = protect;
//# sourceMappingURL=authMiddleware.js.map