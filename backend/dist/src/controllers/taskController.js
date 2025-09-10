"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderTasks = exports.deleteTask = exports.updateTask = exports.createTask = void 0;
const Task_1 = require("../models/Task");
const Project_1 = require("../models/Project");
const User_1 = require("../models/User");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const appError_1 = require("../utils/appError");
const server_1 = require("../server");
const lodash_1 = __importDefault(require("lodash"));
const verifyProjectMembership = async (projectId, userId) => {
    const project = await Project_1.Project.findOne({ _id: projectId, members: userId });
    if (!project) {
        throw new appError_1.AppError('You are not a member of this project or the project does not exist', 403);
    }
    return project;
};
// --- Controllers ---
exports.createTask = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.userId;
    const project = await verifyProjectMembership(projectId, userId);
    const { title, description, status, assigneeEmail } = req.body;
    let assigneeId;
    if (assigneeEmail) {
        const assignee = await User_1.User.findOne({ email: assigneeEmail });
        if (!assignee)
            return next(new appError_1.AppError('Assignee with that email not found', 404));
        if (!project.members.some(memberId => memberId.equals(assignee._id))) {
            return next(new appError_1.AppError('Assignee is not a member of this project', 400));
        }
        assigneeId = assignee._id;
    }
    const task = await Task_1.Task.create({ title, description, status, project: projectId, assignee: assigneeId });
    (0, apiResponse_1.sendSuccess)(res, task, 'Task created successfully', 201);
});
exports.updateTask = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user.userId;
    const { taskId } = req.params;
    const task = await Task_1.Task.findById(taskId);
    if (!task)
        return next(new appError_1.AppError('Task not found', 404));
    await verifyProjectMembership(task.project.toString(), userId);
    const filteredBody = lodash_1.default.pick(req.body, ['title', 'description', 'status', 'dueDate']);
    const updatedTask = await Task_1.Task.findByIdAndUpdate(taskId, filteredBody, { new: true })
        .populate('assignee', 'name email avatarUrl');
    (0, apiResponse_1.sendSuccess)(res, updatedTask, 'Task updated successfully');
});
exports.deleteTask = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user.userId;
    const { taskId } = req.params;
    const task = await Task_1.Task.findById(taskId);
    if (!task)
        return next(new appError_1.AppError('Task not found', 404));
    const projectId = task.project.toString();
    await verifyProjectMembership(task.project.toString(), userId);
    await Task_1.Task.findByIdAndDelete(taskId);
    const allTasks = await Task_1.Task.find({ project: projectId }).sort('order').populate('assignee', 'name email avatarUrl');
    server_1.io.to(projectId).emit('tasks:updated', allTasks);
    (0, apiResponse_1.sendSuccess)(res, null, 'Task deleted successfully');
});
exports.reorderTasks = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { projectId } = req.params;
    const { tasks: updates } = req.body;
    if (!updates || !Array.isArray(updates)) {
        return next(new appError_1.AppError('Invalid payload: tasks array is required', 400));
    }
    // 1. Update the database
    const bulkOps = updates.map(task => ({
        updateOne: {
            filter: { _id: task.id, project: projectId },
            update: { $set: { order: task.order, status: task.status } }
        }
    }));
    await Task_1.Task.bulkWrite(bulkOps);
    // 2. Get the new, authoritative state from the database
    const allTasks = await Task_1.Task.find({ project: projectId }).sort('order').populate('assignee', 'name email avatarUrl');
    // 3. Broadcast the final state to all clients in the room
    server_1.io.to(projectId).emit('tasks:updated', allTasks);
    (0, apiResponse_1.sendSuccess)(res, null, 'Tasks reordered successfully');
});
//# sourceMappingURL=taskController.js.map