import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  getUserById,
  updateUserProfile,
  deleteUser,
  changePassword,
} from "../controllers/userController";
import {
  updateProfileValidator,
  changePasswordValidator,
} from "../utils/validators";
import { validateRequest } from "../middlewares/validationMiddleware";

const router = Router();

router.use(protect);

// Routes for a user to manage THEIR OWN profile

router.get("/:id", getUserById);

router.put(
  "/:id",
  updateProfileValidator,
  validateRequest,
  updateUserProfile
);

router.delete("/:id", deleteUser);

router.put(
  "/:id/password",
  changePasswordValidator,
  validateRequest,
  changePassword
);

export default router;
