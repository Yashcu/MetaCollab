import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Project } from '@/models/Project';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { io } from '@/server';
import mongoose from 'mongoose';
import _ from 'lodash';

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find();
  sendSuccess(res, users, 'Users fetched successfully');
});

export const getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }
  sendSuccess(res, user, 'User fetched successfully');
});

export const updateUserProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.params.id !== req.user?.userId) {
    return next(new AppError('You are not authorized to perform this action', 403));
  }

  const filteredBody = _.pick(req.body, ['name', 'avatarUrl']);

  const updatedUser = await User.findByIdAndUpdate(req.user.userId, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  const projects = await Project.find({ members: updatedUser._id });
  for (const project of projects) {
    const populatedProject = await project.populate('owner members', 'name email avatarUrl');
    io.to(project.id).emit('project:updated', populatedProject);

    const tasks = await mongoose.model('Task').find({ project: project.id }).sort('order').populate('assignee', 'name email avatarUrl');
    io.to(project.id).emit('tasks:updated', tasks);
  }

  sendSuccess(res, updatedUser, 'Profile updated successfully');
});

export const changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;

  if (req.params.id !== req.user?.userId) {
    return next(new AppError('You are not authorized to perform this action', 403));
  }

  const user = await User.findById(req.user.userId).select('+password');

  if (!user || !(await user.comparePassword(currentPassword))) {
     return next(new AppError('Incorrect current password', 401));
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, null, 'Password updated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.params.id !== req.user?.userId) {
    return next(new AppError('You are not authorized to perform this action', 403));
  }

  const user = await User.findByIdAndDelete(req.user.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  sendSuccess(res, null, 'User deleted successfully');
});
