"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const taskController_1 = require("../controllers/taskController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
router.route('/:id').get(taskController_1.getTaskById).put(taskController_1.updateTask).delete(taskController_1.deleteTask);
exports.default = router;
