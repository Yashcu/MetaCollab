"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const taskController_1 = require("../controllers/taskController");
const validators_1 = require("../utils/validators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(authMiddleware_1.protect);
router.post("/", validators_1.taskValidator, validationMiddleware_1.validateRequest, taskController_1.createTask);
router.put("/:taskId", validators_1.taskValidator, validationMiddleware_1.validateRequest, taskController_1.updateTask);
router.delete("/:taskId", taskController_1.deleteTask);
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map