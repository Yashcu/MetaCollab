"use strict";
// src/routes/projectRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const projectController_1 = require("../controllers/projectController");
const taskController_1 = require("../controllers/taskController");
const validators_1 = require("../utils/validators");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
router.post("/", validators_1.projectValidator, validationMiddleware_1.validateRequest, projectController_1.createProject);
router.get("/", projectController_1.getAllProjects);
router.get("/:projectId", projectController_1.getProjectById);
router.patch("/:projectId/tasks/reorder", taskController_1.reorderTasks);
router.put("/:projectId", validators_1.projectValidator, validationMiddleware_1.validateRequest, projectController_1.updateProject);
router.delete("/:projectId", projectController_1.deleteProject);
router.post("/:projectId/members", validators_1.addMemberValidator, validationMiddleware_1.validateRequest, projectController_1.inviteMember);
router.get("/:projectId/tasks", projectController_1.getTasksByProjectId);
router.delete("/:projectId/members/:memberId", projectController_1.removeMemberFromProject);
exports.default = router;
//# sourceMappingURL=projectRoutes.js.map