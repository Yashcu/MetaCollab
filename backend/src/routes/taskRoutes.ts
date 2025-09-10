import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController";
import { taskValidator } from "../utils/validators";
import { validateRequest } from "../middlewares/validationMiddleware";

const router = Router({ mergeParams: true });
router.use(protect);

router.post("/", taskValidator, validateRequest, createTask);

router.put("/:taskId", taskValidator, validateRequest, updateTask);

router.delete("/:taskId", deleteTask);

export default router;
