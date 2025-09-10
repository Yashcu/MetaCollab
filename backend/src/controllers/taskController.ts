import { Request, Response, NextFunction } from 'express';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { io } from '../server';
import _ from 'lodash';
import mongoose from 'mongoose';

const verifyProjectMembership = async (projectId: string, userId: string) => {
  const project = await Project.findOne({ _id: projectId, members: userId });
  if (!project || !project.members.map(String).includes(userId)) {
    throw new AppError('You are not a member of this project or the project does not exist', 403);
  }
  return project;
};

const getAndBroadcastTasks = async (projectId: string) => {
  const tasks = await Task.find({ project: projectId }).sort('order').populate('assignee', 'name email avatarUrl');
  io.to(projectId).emit('tasks:updated', tasks);
};

// --- Controllers ---

export const createTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { projectId } = req.params;
  const userId = req.user!.userId;

  const project = await verifyProjectMembership(projectId, userId);

  const { title, description, status, assigneeEmail } = req.body;
  let assigneeId: mongoose.Types.ObjectId | undefined;

  if (assigneeEmail) {
    const assignee = await User.findOne({ email: assigneeEmail });
    if (!assignee) return next(new AppError('Assignee with that email not found', 404));

    if (!project.members.some(memberId => memberId.equals(assignee._id))) {
      return next(new AppError('Assignee is not a member of this project', 400));
    }
    assigneeId = assignee._id;
  }

  const task = await Task.create({ title, description, status, project: projectId, assignee: assigneeId });

  await getAndBroadcastTasks(projectId);
  sendSuccess(res, task, 'Task created successfully', 201);
});

export const updateTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.userId;
  const { taskId, projectId } = req.params;

  const project = await verifyProjectMembership(projectId, userId);

  const task = await Task.findById(taskId);
  if (!task || task.project.toString() !== projectId) {
    return next(new AppError('Task not found in this project', 404));
  }

  const filteredBody = _.pick(req.body, ['title', 'description', 'status', 'dueDate']);

  if (req.body.assigneeEmail) {
    const assignee = await User.findOne({ email: req.body.assigneeEmail });
    if (!assignee) return next(new AppError('Assignee with that email not found', 404));
    if (!project.members.some(memberId => memberId.equals(assignee._id))) {
      return next(new AppError('Assignee is not a member of this project', 400));
    }
    (filteredBody as any).assignee = assignee._id;
  } else if (req.body.assigneeEmail === null) {
    (filteredBody as any).assignee = null;
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, filteredBody, { new: true })
    .populate('assignee', 'name email avatarUrl');

  await getAndBroadcastTasks(projectId);

  sendSuccess(res, updatedTask, 'Task updated successfully');
});

export const deleteTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.userId;
  const { taskId, projectId } = req.params;

  await verifyProjectMembership(projectId, userId);

  const task = await Task.findOneAndDelete({ _id: taskId, project: projectId });
  if (!task) {
    return next(new AppError('Task not found in this project', 404));
  }

  await getAndBroadcastTasks(projectId);
  sendSuccess(res, null, 'Task deleted successfully');
});

export const reorderTasks = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { projectId } = req.params;
  const { tasks: updates } = req.body;

  if (!updates || !Array.isArray(updates)) {
      return next(new AppError('Invalid payload: tasks array is required', 400));
  }

  const bulkOps = updates.map(task => ({
      updateOne: {
          filter: { _id: task.id, project: projectId },
          update: { $set: { order: task.order, status: task.status } }
      }
  }));
  await Task.bulkWrite(bulkOps);

  if (bulkOps.length > 0) {
    await Task.bulkWrite(bulkOps);
  }

  await getAndBroadcastTasks(projectId);
  sendSuccess(res, null, 'Tasks reordered successfully');
});
