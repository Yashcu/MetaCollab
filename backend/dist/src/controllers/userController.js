"use strict";
// src/controllers/userController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.changePassword = exports.updateUserProfile = exports.getUserById = exports.getAllUsers = void 0;
const User_1 = require("../models/User");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const appError_1 = require("../utils/appError");
const lodash_1 = __importDefault(require("lodash")); // A great utility library for object manipulation
// --- Public/Admin Controllers ---
// This is likely an admin-only function. It will be protected by 'protect' and 'isAdmin' middleware in the routes.
exports.getAllUsers = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const users = await User_1.User.find();
    (0, apiResponse_1.sendSuccess)(res, users, 'Users fetched successfully');
});
exports.getUserById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const user = await User_1.User.findById(req.params.id);
    if (!user) {
        return next(new appError_1.AppError('User not found', 404));
    }
    (0, apiResponse_1.sendSuccess)(res, user, 'User fetched successfully');
});
// --- User-Specific Controllers (Require Authorization) ---
exports.updateUserProfile = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    // 1. AUTHORIZATION: Ensure the logged-in user is the one making the change.
    if (req.params.id !== req.user?.userId) {
        return next(new appError_1.AppError('You are not authorized to perform this action', 403));
    }
    // 2. FILTER BODY: Only allow specific fields to be updated.
    const filteredBody = lodash_1.default.pick(req.body, ['name', 'avatarUrl']);
    const updatedUser = await User_1.User.findByIdAndUpdate(req.user.userId, filteredBody, {
        new: true,
        runValidators: true,
    });
    (0, apiResponse_1.sendSuccess)(res, updatedUser, 'Profile updated successfully');
});
exports.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    // 1. AUTHORIZATION
    if (req.params.id !== req.user?.userId) {
        return next(new appError_1.AppError('You are not authorized to perform this action', 403));
    }
    // 2. FETCH USER WITH PASSWORD: Explicitly select the password for comparison.
    const user = await User_1.User.findById(req.user.userId).select('+password');
    // 3. VERIFY CURRENT PASSWORD
    if (!user || !(await user.comparePassword(currentPassword))) {
        return next(new appError_1.AppError('Incorrect current password', 401));
    }
    // 4. SET NEW PASSWORD & SAVE: The pre('save') hook in the model will handle hashing.
    user.password = newPassword;
    await user.save();
    (0, apiResponse_1.sendSuccess)(res, null, 'Password updated successfully');
});
exports.deleteUser = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    // 1. AUTHORIZATION
    if (req.params.id !== req.user?.userId) {
        return next(new appError_1.AppError('You are not authorized to perform this action', 403));
    }
    const user = await User_1.User.findByIdAndDelete(req.user.userId);
    if (!user) {
        return next(new appError_1.AppError('User not found', 404));
    }
    // Our pre('findOneAndDelete') hook on the User model will handle cleanup.
    (0, apiResponse_1.sendSuccess)(res, null, 'User deleted successfully');
});
//# sourceMappingURL=userController.js.map