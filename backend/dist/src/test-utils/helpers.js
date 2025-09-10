"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthAgent = void 0;
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const User_1 = require("../models/User");
// Helper to convert expiry string to seconds, mirroring the controller logic
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
const getAuthAgent = async () => {
    const agent = (0, supertest_1.default)(app_1.default);
    const uniqueId = new mongoose_1.default.Types.ObjectId();
    const userData = {
        _id: uniqueId,
        name: `Test User ${uniqueId}`,
        email: `test${uniqueId}@example.com`,
        password: 'password123',
        role: 'user',
    };
    const user = await User_1.User.create(userData);
    const payload = {
        userId: user._id.toString(),
        name: user.name,
        role: user.role,
        email: user.email,
    };
    const token = jsonwebtoken_1.default.sign(payload, config_1.config.JWT_SECRET, {
        expiresIn: getExpiryInSeconds(config_1.config.JWT_EXPIRES_IN),
    });
    const userJson = user.toJSON();
    return { agent, user: userJson, token };
};
exports.getAuthAgent = getAuthAgent;
//# sourceMappingURL=helpers.js.map