import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  createProject,
  getAllProjects,
  getProjectById,
  deleteProject,
  addMemberToProject,
  getTasksByProjectId,
} from "../controllers/projectController";
import { createTask } from "../controllers/taskController";

const router = Router();
router.use(protect);

router.route("/").post(createProject).get(getAllProjects);
router.route("/:id").get(getProjectById).delete(deleteProject);
router.route("/:projectId/members").post(addMemberToProject);
router.route("/:projectId/tasks").get(getTasksByProjectId).post(createTask);

export default router;
