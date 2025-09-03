import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
} from "../controllers/userController";

const router = Router();

// Protect all user routes
router.use(protect);

router.route("/").get(getAllUsers);
router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);
router.put("/:id/password", changePassword);

export default router;
