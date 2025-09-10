"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validators_1 = require("../utils/validators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post("/signup", validators_1.signupValidator, validationMiddleware_1.validateRequest, authController_1.signup);
/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", validators_1.loginValidator, validationMiddleware_1.validateRequest, authController_1.login);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map