import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/adminMiddleware"; // <-- Import isAdmin
import { getStats } from "../controllers/adminController";

const router = Router();

router.use(protect, isAdmin);

router.get("/stats", getStats);

export default router;
