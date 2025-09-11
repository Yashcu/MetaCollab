import { Request, Response, NextFunction } from 'express';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { Invitation } from '../models/Invitation';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { getIO } from "../socketInstance";
import { onlineUsers } from '../socket';
import _ from 'lodash';

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const ownerId = req.user!.userId;

  const projectDocument = await Project.create({
    name,
    description,
    owner: ownerId,
    members: [ownerId],
  });

  const project = await projectDocument.populate('owner members', 'name email avatarUrl');

  const ownerSocketId = onlineUsers.get(ownerId);
  if (ownerSocketId) {
    const io = getIO();
    io.to(ownerSocketId).emit('dashboard:refetch');
  }

  sendSuccess(res, project, 'Project created successfully', 201);
});

export const getAllProjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const projects = await Project.find({ members: userId }).populate('owner members', 'name email avatarUrl');
  sendSuccess(res, projects, 'Projects fetched successfully');
});

export const getProjectById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.userId;
  const project = await Project.findOne({ _id: req.params.projectId, members: userId })
    .populate('owner members', 'name email avatarUrl');

  if (!project) {
    return next(new AppError('Project not found or you do not have access', 404));
  }
  sendSuccess(res, project, 'Project fetched successfully');
});

export const updateProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.userId;
  const { projectId } = req.params;
  const filteredBody = _.pick(req.body, ['name', 'description']);

  const updatedProject = await Project.findOneAndUpdate(
    { _id: projectId, owner: userId },
    filteredBody,
    { new: true, runValidators: true }
  ).populate('owner members', 'name email avatarUrl');

  if (!updatedProject) {
    return next(new AppError('Project not found or you do not have access to modify it', 404));
  }

  const io = getIO();
  io.to(projectId).emit('project:updated', updatedProject);

  sendSuccess(res, updatedProject, 'Project updated successfully');
});

export const deleteProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.userId;
  const { projectId } = req.params;

  const project = await Project.findOneAndDelete({ _id: projectId, owner: userId });

  if (!project) {
    return next(new AppError('Project not found or you are not the owner', 404));
  }

  const io = getIO();
  io.to(projectId).emit('project:deleted', { projectId });

  sendSuccess(res, null, 'Project deleted successfully');
});

export const inviteMember = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user!.userId;
  const { projectId } = req.params;
  const { email } = req.body;

  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!project) return next(new AppError('Project not found or you are not the owner', 404));

  const userToInvite = await User.findOne({ email });
  if (!userToInvite) return next(new AppError('User with that email not found', 404));

  if (project.members.includes(userToInvite._id)) {
     return next(new AppError('User is already a member of this project', 400));
  }

  const existingInvite = await Invitation.findOne({ project: projectId, recipient: userToInvite._id, status: 'pending' });
  if (existingInvite) {
      return next(new AppError('An invitation has already been sent to this user.', 400));
  }

  await Invitation.create({
      project: projectId,
      inviter: ownerId,
      recipient: userToInvite._id
  });

  const recipientSocketId = onlineUsers.get(userToInvite._id.toString());
  if (recipientSocketId) {
    const io = getIO();
    io.to(recipientSocketId).emit('invitation:new');
  }

  sendSuccess(res, null, 'Invitation sent successfully');
});


export const getTasksByProjectId = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.userId;
  const { projectId } = req.params;

  const project = await Project.findOne({ _id: projectId, members: userId });
  if (!project) {
    return next(new AppError('Project not found or you do not have access', 404));
  }

  const tasks = await Task.find({ project: projectId }).sort('order').populate('assignee', 'name email avatarUrl');
  sendSuccess(res, tasks, 'Tasks fetched successfully');
});

export const removeMemberFromProject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = req.user!.userId;
  const { projectId, memberId } = req.params;

  const projectOwnerCheck = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!projectOwnerCheck) {
    return next(new AppError('Project not found or you are not the owner', 404));
  }
  if (projectOwnerCheck.owner.toString() === memberId) {
    return next(new AppError("You cannot remove yourself as the owner.", 400));
  }

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { $pull: { members: memberId } },
    { new: true }
  ).populate('owner members', 'name email avatarUrl');

  if (!updatedProject) {
    return next(new AppError('Project not found.', 404));
  }

  const io = getIO();
  io.to(updatedProject.id.toString()).emit('project:updated', updatedProject);

  const kickedUserSocketId = onlineUsers.get(memberId);
  if (kickedUserSocketId) {
    io.to(kickedUserSocketId).emit('kicked:from_project', {
      projectId: updatedProject.id,
      projectName: updatedProject.name,
    });
  }

  sendSuccess(res, updatedProject, 'Member removed successfully');
});
