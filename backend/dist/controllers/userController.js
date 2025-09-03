"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = void 0;
const User_1 = require("../models/User");
const apiResponse_1 = require("../utils/apiResponse");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User_1.User.find().select("-password"); // exclude passwords
        (0, apiResponse_1.successResponse)(res, users, "Users fetched");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to fetch users", 500, err);
    }
};
exports.getAllUsers = getAllUsers;
// Get user by ID
const getUserById = async (req, res) => {
    try {
        const user = await User_1.User.findById(req.params.id).select("-password");
        if (!user)
            return (0, apiResponse_1.errorResponse)(res, "User not found", 404);
        (0, apiResponse_1.successResponse)(res, user, "User fetched");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to fetch user", 500, err);
    }
};
exports.getUserById = getUserById;
// Update user
const updateUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updateData = { name, email };
        if (password)
            updateData.password = await bcryptjs_1.default.hash(password, 10);
        const user = await User_1.User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");
        if (!user)
            return (0, apiResponse_1.errorResponse)(res, "User not found", 404);
        (0, apiResponse_1.successResponse)(res, user, "User updated");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to update user", 500, err);
    }
};
exports.updateUser = updateUser;
// Delete user
const deleteUser = async (req, res) => {
    try {
        const user = await User_1.User.findByIdAndDelete(req.params.id);
        if (!user)
            return (0, apiResponse_1.errorResponse)(res, "User not found", 404);
        (0, apiResponse_1.successResponse)(res, null, "User deleted");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to delete user", 500, err);
    }
};
exports.deleteUser = deleteUser;
