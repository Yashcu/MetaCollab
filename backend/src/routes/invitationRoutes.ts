import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { getMyInvitations, acceptInvitation, declineInvitation } from "../controllers/invitationController";

const router = Router();

router.use(protect);

router.get('/', getMyInvitations);
router.post('/:invitationId/accept', acceptInvitation);
router.post('/:invitationId/decline', declineInvitation);

export default router;
