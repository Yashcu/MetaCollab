import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/adminMiddleware";
import { getAllUsers } from "../controllers/userController";

const router = Router();

// Protect all admin routes
router.use(protect, isAdmin);

router.get("/users", getAllUsers);

export default router;
