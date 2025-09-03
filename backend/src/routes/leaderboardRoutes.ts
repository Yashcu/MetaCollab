import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { getGlobalLeaderboard, getProjectLeaderboard } from "../controllers/leaderboardController";

const router = Router();

// All leaderboard routes should be protected
router.use(protect);

router.get("/global", getGlobalLeaderboard);
router.get("/project/:projectId", getProjectLeaderboard);

export default router;
