"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Protect all admin routes
router.use(authMiddleware_1.protect, adminMiddleware_1.isAdmin);
router.get("/users", userController_1.getAllUsers);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map