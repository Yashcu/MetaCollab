import { Router } from "express";
import passport from "passport";
import { signup, login, oauthCallback } from "../controllers/authController";
import { signupValidator, loginValidator } from "../utils/validators";
import { validateRequest } from "../middlewares/validationMiddleware";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

const router = Router();

// Apply the rate limiter to password-based authentication routes
router.post("/signup", authLimiter, signupValidator, validateRequest, signup);
router.post("/login", authLimiter, loginValidator, validateRequest, login);

// OAuth routes are less susceptible to this kind of brute-force attack
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), oauthCallback);
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get("/github/callback", passport.authenticate("github", { session: false }), oauthCallback);

export default router;
