"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const invitationController_1 = require("../controllers/invitationController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
router.get('/', invitationController_1.getMyInvitations);
router.post('/:invitationId/accept', invitationController_1.acceptInvitation);
router.post('/:invitationId/decline', invitationController_1.declineInvitation);
exports.default = router;
//# sourceMappingURL=invitationRoutes.js.map