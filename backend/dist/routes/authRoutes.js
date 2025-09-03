"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const validators_1 = require("../utils/validators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = (0, express_1.Router)();
// --- Standard Authentication ---
router.post("/signup", validators_1.signupValidator, validationMiddleware_1.validateRequest, authController_1.signup);
router.post("/login", validators_1.loginValidator, validationMiddleware_1.validateRequest, authController_1.login);
// --- Google OAuth ---
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport_1.default.authenticate("google", { session: false }), authController_1.oauthCallback);
// --- GitHub OAuth ---
router.get("/github", passport_1.default.authenticate("github", { scope: ["user:email"] }));
router.get("/github/callback", passport_1.default.authenticate("github", { session: false }), authController_1.oauthCallback);
exports.default = router;
