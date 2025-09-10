"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const User_1 = require("../models/User");
const Project_1 = require("../models/Project");
const Task_1 = require("../models/Task");
const apiResponse_1 = require("../utils/apiResponse");
// Helper type guard for req.user
const isUserWithId = (user) => {
    return user && typeof user.userId === "string" && 'role' in user;
};
// - getStats: counts total users, total projects, tasks completed
const getStats = async (req, res) => {
    try {
        if (!isUserWithId(req.user) || req.user.role !== 'admin') {
            return (0, apiResponse_1.sendError)(res, "Access denied. Admins only.", 403);
        }
        const totalUsers = await User_1.User.countDocuments();
        const totalProjects = await Project_1.Project.countDocuments();
        const tasksCompleted = await Task_1.Task.countDocuments({ status: "done" });
        (0, apiResponse_1.sendSuccess)(res, { totalUsers, totalProjects, tasksCompleted }, "Dashboard stats fetched successfully");
    }
    catch (err) {
        (0, apiResponse_1.sendError)(res, "Failed to fetch stats", 500, err);
    }
};
exports.getStats = getStats;
//# sourceMappingURL=adminController.js.map