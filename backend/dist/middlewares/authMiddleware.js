"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const apiResponse_1 = require("../utils/apiResponse");
// Protect middleware
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
        return (0, apiResponse_1.errorResponse)(res, "Not authorized", 401);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        req.user = decoded;
        next();
    }
    catch (err) {
        return (0, apiResponse_1.errorResponse)(res, "Token invalid or expired", 401);
    }
};
exports.protect = protect;
