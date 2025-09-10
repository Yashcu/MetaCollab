import { Router } from "express";
import { signup, login } from "../controllers/authController";
import { signupValidator, loginValidator } from "../utils/validators";
import { validateRequest } from "../middlewares/validationMiddleware";

const router = Router();

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post("/signup", signupValidator, validateRequest, signup);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", loginValidator, validateRequest, login);

export default router;
