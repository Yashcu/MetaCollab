"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const leaderboardController_1 = require("../controllers/leaderboardController");
const router = (0, express_1.Router)();
// All leaderboard routes should be protected
router.use(authMiddleware_1.protect);
router.get("/global", leaderboardController_1.getGlobalLeaderboard);
router.get("/project/:projectId", leaderboardController_1.getProjectLeaderboard);
exports.default = router;
