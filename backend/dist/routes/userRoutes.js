"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Protect all user routes
router.use(authMiddleware_1.protect);
router.route("/").get(userController_1.getAllUsers);
router.route("/:id").get(userController_1.getUserById).put(userController_1.updateUser).delete(userController_1.deleteUser);
exports.default = router;
