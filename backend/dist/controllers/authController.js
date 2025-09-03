"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthCallback = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const config_1 = require("../config/config");
const apiResponse_1 = require("../utils/apiResponse");
const expireMap = {
    s: 1, m: 60, h: 3600, d: 86400,
};
const parseExpiry = (str) => {
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match)
        return 86400; // default 1 day
    const [, num, unit] = match;
    return parseInt(num) * expireMap[unit];
};
const generateToken = (user) => {
    const payload = { userId: user._id.toString(), name: user.name, role: user.role };
    const options = {
        expiresIn: parseExpiry(config_1.config.jwtExpiresIn),
    };
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, options);
};
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser)
            return (0, apiResponse_1.errorResponse)(res, "User already exists", 400);
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Role will be set to 'user' by default from the schema
        const user = await User_1.User.create({ name, email, password: hashedPassword });
        const userResponse = { id: user._id, name: user.name, email: user.email, role: user.role };
        const token = generateToken(user);
        (0, apiResponse_1.successResponse)(res, { token, user: userResponse }, "User created", 201);
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Signup failed", 500, err);
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email });
        if (!user || !user.password)
            return (0, apiResponse_1.errorResponse)(res, "Invalid credentials", 401);
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            return (0, apiResponse_1.errorResponse)(res, "Invalid credentials", 401);
        const token = generateToken(user);
        const userResponse = { id: user._id, name: user.name, email: user.email, role: user.role };
        (0, apiResponse_1.successResponse)(res, { token, user: userResponse }, "Login successful");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Login failed", 500, err);
    }
};
exports.login = login;
const oauthCallback = (req, res) => {
    const user = req.user;
    const token = generateToken(user);
    const userResponse = { id: user._id, name: user.name, email: user.email, role: user.role };
    (0, apiResponse_1.successResponse)(res, { token, user: userResponse }, "Login successful");
};
exports.oauthCallback = oauthCallback;
