"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMemberFromProject = exports.getTasksByProjectId = exports.inviteMember = exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getAllProjects = exports.createProject = void 0;
const Project_1 = require("../models/Project");
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const Invitation_1 = require("../models/Invitation");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const appError_1 = require("../utils/appError");
const server_1 = require("../server");
const socket_1 = require("../socket");
const lodash_1 = __importDefault(require("lodash"));
exports.createProject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, description } = req.body;
    const ownerId = req.user.userId;
    let project = await Project_1.Project.create({
        name,
        description,
        owner: ownerId,
        members: [ownerId],
    });
    project = await project.populate('owner members', 'name email avatarUrl');
    (0, apiResponse_1.sendSuccess)(res, project, 'Project created successfully', 201);
});
exports.getAllProjects = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const projects = await Project_1.Project.find({ members: userId }).populate('owner members', 'name email avatarUrl');
    (0, apiResponse_1.sendSuccess)(res, projects, 'Projects fetched successfully');
});
exports.getProjectById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user.userId;
    const project = await Project_1.Project.findOne({ _id: req.params.projectId, members: userId })
        .populate('owner members', 'name email avatarUrl');
    if (!project) {
        return next(new appError_1.AppError('Project not found or you do not have access', 404));
    }
    (0, apiResponse_1.sendSuccess)(res, project, 'Project fetched successfully');
});
exports.updateProject = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user.userId;
    const filteredBody = lodash_1.default.pick(req.body, ['name', 'description']);
    const updatedProject = await Project_1.Project.findOneAndUpdate({ _id: req.params.projectId, members: userId }, filteredBody, { new: true, runValidators: true }).populate('owner members', 'name email avatarUrl');
    if (!updatedProject) {
        return next(new appError_1.AppError('Project not found or you do not have access to modify it', 404));
    }
    (0, apiResponse_1.sendSuccess)(res, updatedProject, 'Project updated successfully');
});
exports.deleteProject = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user.userId;
    const project = await Project_1.Project.findOneAndDelete({ _id: req.params.projectId, owner: userId });
    if (!project) {
        return next(new appError_1.AppError('Project not found or you are not the owner', 404));
    }
    (0, apiResponse_1.sendSuccess)(res, null, 'Project deleted successfully');
});
exports.inviteMember = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const ownerId = req.user.userId;
    const { projectId } = req.params;
    const { email } = req.body;
    const project = await Project_1.Project.findOne({ _id: projectId, owner: ownerId });
    if (!project)
        return next(new appError_1.AppError('Project not found or you are not the owner', 404));
    const userToInvite = await User_1.User.findOne({ email });
    if (!userToInvite)
        return next(new appError_1.AppError('User with that email not found', 404));
    if (project.members.includes(userToInvite._id)) {
        return next(new appError_1.AppError('User is already a member of this project', 400));
    }
    // Check for existing pending invitation
    const existingInvite = await Invitation_1.Invitation.findOne({ project: projectId, recipient: userToInvite._id, status: 'pending' });
    if (existingInvite) {
        return next(new appError_1.AppError('An invitation has already been sent to this user.', 400));
    }
    // Create and save the new invitation
    await Invitation_1.Invitation.create({
        project: projectId,
        inviter: ownerId,
        recipient: userToInvite._id
    });
    const recipientSocketId = socket_1.onlineUsers.get(userToInvite._id.toString());
    if (recipientSocketId) {
        // If the invited user is online, send them a direct notification
        server_1.io.to(recipientSocketId).emit('invitation:new');
    }
    (0, apiResponse_1.sendSuccess)(res, null, 'Invitation sent successfully');
});
exports.getTasksByProjectId = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user.userId;
    const { projectId } = req.params;
    const project = await Project_1.Project.findOne({ _id: projectId, members: userId });
    if (!project) {
        return next(new appError_1.AppError('Project not found or you do not have access', 404));
    }
    const tasks = await Task_1.Task.find({ project: projectId }).sort('order').populate('assignee', 'name email avatarUrl');
    (0, apiResponse_1.sendSuccess)(res, tasks, 'Tasks fetched successfully');
});
exports.removeMemberFromProject = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const ownerId = req.user.userId;
    const { projectId, memberId } = req.params;
    // You cannot remove the owner
    const projectOwnerCheck = await Project_1.Project.findOne({ _id: projectId, owner: ownerId });
    if (!projectOwnerCheck) {
        return next(new appError_1.AppError('Project not found or you are not the owner', 404));
    }
    if (projectOwnerCheck.owner.toString() === memberId) {
        return next(new appError_1.AppError("You cannot remove yourself as the owner.", 400));
    }
    const updatedProject = await Project_1.Project.findByIdAndUpdate(projectId, { $pull: { members: memberId } }, { new: true }).populate('owner members', 'name email avatarUrl');
    if (!updatedProject) {
        return next(new appError_1.AppError('Project not found.', 404));
    }
    server_1.io.to(updatedProject.id.toString()).emit('project:updated', updatedProject);
    const kickedUserSocketId = socket_1.onlineUsers.get(memberId);
    if (kickedUserSocketId) {
        server_1.io.to(kickedUserSocketId).emit('kicked:from_project', {
            projectId: updatedProject.id,
            projectName: updatedProject.name,
        });
    }
    (0, apiResponse_1.sendSuccess)(res, updatedProject, 'Member removed successfully');
});
//# sourceMappingURL=projectController.js.map