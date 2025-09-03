import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { updateTask, deleteTask, getTaskById, reorderTasks } from "../controllers/taskController";

const router = Router();
router.use(protect);

router.post('/reorder', reorderTasks);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);

export default router;


