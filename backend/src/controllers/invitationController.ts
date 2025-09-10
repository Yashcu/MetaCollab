import { Request, Response, NextFunction } from 'express';
import { Invitation } from '../models/Invitation';
import { Project } from '../models/Project';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { io } from '../server';
import { onlineUsers } from '../socket';
import { User } from '../models/User';

export const getMyInvitations = asyncHandler(async (req: Request, res: Response) => {
  const invitations = await Invitation.find({ recipient: req.user!.userId, status: 'pending' })
    .populate('project', 'name')
    .populate('inviter', 'name email');
  sendSuccess(res, invitations, 'Invitations fetched successfully');
});

export const acceptInvitation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { invitationId } = req.params;
  const userId = req.user!.userId;

  const invitation = await Invitation.findById(invitationId).populate('project', 'name');

  if (!invitation || invitation.recipient.toString() !== userId || invitation.status !== 'pending') {
    return next(new AppError('Invitation not found or you are not authorized', 404));
  }

  const updatedProject = await Project.findByIdAndUpdate(
    invitation.project,
    { $addToSet: { members: userId } },
    { new: true }
  ).populate('owner members', 'name email avatarUrl');

  invitation.status = 'accepted';
  await invitation.save();

  if (updatedProject) {
    io.to(updatedProject.id.toString()).emit('project:updated', updatedProject);

    const newUser = await User.findById(userId);
    if (newUser) {
      io.to(updatedProject.id.toString()).emit('user:joined', {
        userId: newUser.id,
        userName: newUser.name,
        avatarUrl: newUser.avatarUrl
      });
    }
  }

  const inviterSocketId = onlineUsers.get(invitation.inviter.toString());
  if (inviterSocketId) {
    io.to(inviterSocketId).emit('invitation:accepted', {
      projectName: (invitation.project as any).name,
      recipientName: req.user!.name,
    });
  }

  const recipientSocketId = onlineUsers.get(userId);
  if (recipientSocketId) {
      io.to(recipientSocketId).emit('dashboard:refetch');
  }

  sendSuccess(res, null, 'Invitation accepted successfully');
});

export const declineInvitation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { invitationId } = req.params;
  const invitation = await Invitation.findById(invitationId).populate('project', 'name');

  if (!invitation || invitation.recipient.toString() !== req.user!.userId || invitation.status !== 'pending') {
    return next(new AppError('Invitation not found or you are not authorized', 404));
  }

  invitation.status = 'declined';
  await invitation.save();

  const inviterSocketId = onlineUsers.get(invitation.inviter.toString());
  if (inviterSocketId) {
    io.to(inviterSocketId).emit('invitation:declined', {
      projectName: (invitation.project as any).name,
      recipientName: req.user!.name,
    });
  }
  sendSuccess(res, null, 'Invitation declined');
});
