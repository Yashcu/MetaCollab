"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const userController_1 = require("../controllers/userController");
const validators_1 = require("../utils/validators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
// Routes for a user to manage THEIR OWN profile
router.get("/:id", userController_1.getUserById);
router.put("/:id", validators_1.updateProfileValidator, validationMiddleware_1.validateRequest, userController_1.updateUserProfile);
router.delete("/:id", userController_1.deleteUser);
router.put("/:id/password", validators_1.changePasswordValidator, validationMiddleware_1.validateRequest, userController_1.changePassword);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map