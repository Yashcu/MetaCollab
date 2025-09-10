// src/routes/projectRoutes.ts

import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject, // Assuming you'll add an updateProject route
  deleteProject,
  inviteMember,
  removeMemberFromProject,
  getTasksByProjectId,
} from "../controllers/projectController";
import { reorderTasks } from "../controllers/taskController";
import { projectValidator, addMemberValidator } from "../utils/validators";
import { validateRequest } from "../middlewares/validationMiddleware";

const router = Router();

router.use(protect);

router.post("/", projectValidator, validateRequest, createProject);

router.get("/", getAllProjects);

router.get("/:projectId", getProjectById);

router.patch("/:projectId/tasks/reorder", reorderTasks);

router.put("/:projectId", projectValidator, validateRequest, updateProject);

router.delete("/:projectId", deleteProject);

router.post(
  "/:projectId/members",
  addMemberValidator,
  validateRequest,
  inviteMember
);


router.get("/:projectId/tasks", getTasksByProjectId);

router.delete("/:projectId/members/:memberId", removeMemberFromProject);


export default router;
