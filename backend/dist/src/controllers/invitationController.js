"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.declineInvitation = exports.acceptInvitation = exports.getMyInvitations = void 0;
const Invitation_1 = require("../models/Invitation");
const Project_1 = require("../models/Project");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const appError_1 = require("../utils/appError");
const server_1 = require("../server");
const socket_1 = require("../socket");
exports.getMyInvitations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const invitations = await Invitation_1.Invitation.find({ recipient: req.user.userId, status: 'pending' })
        .populate('project', 'name')
        .populate('inviter', 'name email');
    (0, apiResponse_1.sendSuccess)(res, invitations, 'Invitations fetched successfully');
});
exports.acceptInvitation = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { invitationId } = req.params;
    const invitation = await Invitation_1.Invitation.findById(invitationId).populate('project', 'name');
    if (!invitation || invitation.recipient.toString() !== req.user.userId || invitation.status !== 'pending') {
        return next(new appError_1.AppError('Invitation not found or you are not authorized', 404));
    }
    const updatedProject = await Project_1.Project.findByIdAndUpdate(invitation.project, {
        $addToSet: { members: req.user.userId }
    }, { new: true }).populate('owner members', 'name email avatarUrl');
    invitation.status = 'accepted';
    await invitation.save();
    if (updatedProject) {
        server_1.io.to(updatedProject.id.toString()).emit('project:updated', updatedProject);
    }
    const inviterSocketId = socket_1.onlineUsers.get(invitation.inviter.toString());
    if (inviterSocketId) {
        server_1.io.to(inviterSocketId).emit('invitation:accepted', {
            projectName: invitation.project.name,
            recipientName: req.user.name,
        });
    }
    const recipientSocketId = socket_1.onlineUsers.get(req.user.userId);
    if (recipientSocketId) {
        server_1.io.to(recipientSocketId).emit('dashboard:refetch');
    }
    (0, apiResponse_1.sendSuccess)(res, null, 'Invitation accepted successfully');
});
exports.declineInvitation = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { invitationId } = req.params;
    const invitation = await Invitation_1.Invitation.findById(invitationId).populate('project', 'name');
    if (!invitation || invitation.recipient.toString() !== req.user.userId || invitation.status !== 'pending') {
        return next(new appError_1.AppError('Invitation not found or you are not authorized', 404));
    }
    invitation.status = 'declined';
    await invitation.save();
    const inviterSocketId = socket_1.onlineUsers.get(invitation.inviter.toString());
    if (inviterSocketId) {
        server_1.io.to(inviterSocketId).emit('invitation:declined', {
            projectName: invitation.project.name,
            recipientName: req.user.name,
        });
    }
    (0, apiResponse_1.sendSuccess)(res, null, 'Invitation declined');
});
//# sourceMappingURL=invitationController.js.map