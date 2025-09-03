"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectLeaderboard = exports.getGlobalLeaderboard = void 0;
const apiResponse_1 = require("../utils/apiResponse");
// Get global leaderboard
const getGlobalLeaderboard = async (req, res) => {
    try {
        // In a real application, you would calculate scores based on tasks completed, etc.
        // For now, we return mock data.
        const mockLeaderboard = [
            { id: "1", name: "Alice", email: "alice@example.com", points: 1500, role: "user" },
            { id: "2", name: "Bob", email: "bob@example.com", points: 1250, role: "user" },
            { id: "3", name: "Charlie", email: "charlie@example.com", points: 980, role: "user" },
        ];
        (0, apiResponse_1.successResponse)(res, mockLeaderboard, "Global leaderboard fetched");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to fetch global leaderboard", 500, err);
    }
};
exports.getGlobalLeaderboard = getGlobalLeaderboard;
// Get project-specific leaderboard (placeholder)
const getProjectLeaderboard = async (req, res) => {
    try {
        const { projectId } = req.params;
        const mockLeaderboard = [
            { id: "1", name: "Alice", email: "alice@example.com", points: 800, role: "user" },
            { id: "3", name: "Charlie", email: "charlie@example.com", points: 650, role: "user" },
        ];
        (0, apiResponse_1.successResponse)(res, mockLeaderboard, `Leaderboard for project ${projectId} fetched`);
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to fetch project leaderboard", 500, err);
    }
};
exports.getProjectLeaderboard = getProjectLeaderboard;
