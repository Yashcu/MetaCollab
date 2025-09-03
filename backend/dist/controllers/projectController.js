"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.addMemberToProject = exports.getProjectById = exports.getAllProjects = exports.getTasksByProjectId = exports.createProject = void 0;
const Project_1 = require("../models/Project");
const apiResponse_1 = require("../utils/apiResponse");
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
// Create a project
const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!req.user || !('userId' in req.user)) {
            return (0, apiResponse_1.errorResponse)(res, "Not authorized", 401);
        }
        const owner = req.user.userId;
        // When creating a project, the owner is also a member by default
        const project = await Project_1.Project.create({ name, description, owner, members: [owner] });
        (0, apiResponse_1.successResponse)(res, project, "Project created", 201);
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to create project", 500, err);
    }
};
exports.createProject = createProject;
const getTasksByProjectId = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await Task_1.Task.find({ project: projectId }).populate("assignee", "name");
        (0, apiResponse_1.successResponse)(res, tasks, "Tasks for project fetched");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to fetch tasks for project", 500, err);
    }
};
exports.getTasksByProjectId = getTasksByProjectId;
// Get all projects
const getAllProjects = async (req, res) => {
    try {
        if (!req.user || !('userId' in req.user)) {
            return (0, apiResponse_1.errorResponse)(res, "Not authorized", 401);
        }
        const userId = req.user.userId;
        // FIX: Removed the second argument from populate to get full user objects
        const projects = await Project_1.Project.find({ members: userId }).populate("owner members");
        (0, apiResponse_1.successResponse)(res, projects, "Projects fetched");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to fetch projects", 500, err);
    }
};
exports.getAllProjects = getAllProjects;
// Get project by ID
// ... (imports and other functions)
// Get project by ID
const getProjectById = async (req, res) => {
    try {
        if (!req.user || !('userId' in req.user)) {
            return (0, apiResponse_1.errorResponse)(res, "Not authorized", 401);
        }
        const userId = req.user.userId;
        const project = await Project_1.Project.findById(req.params.id);
        if (!project || !project.members.some(memberId => memberId.toString() === userId)) {
            return (0, apiResponse_1.errorResponse)(res, "Project not found or access denied", 404);
        }
        // If the check passes, populate the fields and send the response.
        const populatedProject = await project.populate("owner members");
        (0, apiResponse_1.successResponse)(res, populatedProject, "Project fetched");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to fetch project", 500, err);
    }
};
exports.getProjectById = getProjectById;
const addMemberToProject = async (req, res) => {
    try {
        if (!req.user || !('userId' in req.user)) {
            return (0, apiResponse_1.errorResponse)(res, "Not authorized", 401);
        }
        const requesterId = req.user.userId;
        const { projectId } = req.params;
        const { email } = req.body;
        const project = await Project_1.Project.findById(projectId);
        if (!project) {
            return (0, apiResponse_1.errorResponse)(res, "Project not found", 404);
        }
        // Security Check: Only the project owner can add members
        if (project.owner.toString() !== requesterId) {
            return (0, apiResponse_1.errorResponse)(res, "Only the project owner can add members", 403);
        }
        const userToAdd = await User_1.User.findOne({ email });
        if (!userToAdd) {
            return (0, apiResponse_1.errorResponse)(res, "User with that email not found", 404);
        }
        // Add user to members array if not already present
        await Project_1.Project.findByIdAndUpdate(projectId, { $addToSet: { members: userToAdd._id } });
        const updatedProject = await Project_1.Project.findById(projectId).populate("owner members", "name email");
        (0, apiResponse_1.successResponse)(res, updatedProject, "Member added successfully");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to add member", 500, err);
    }
};
exports.addMemberToProject = addMemberToProject;
// Update project
const updateProject = async (req, res) => {
    try {
        const project = await Project_1.Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!project)
            return (0, apiResponse_1.errorResponse)(res, "Project not found", 404);
        (0, apiResponse_1.successResponse)(res, project, "Project updated");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to update project", 500, err);
    }
};
exports.updateProject = updateProject;
// Delete project
// ... (imports and other functions)
// Delete project
const deleteProject = async (req, res) => {
    try {
        if (!req.user || !('userId' in req.user)) {
            return (0, apiResponse_1.errorResponse)(res, "Not authorized", 401);
        }
        const requesterId = req.user.userId;
        const project = await Project_1.Project.findById(req.params.id);
        if (!project) {
            return (0, apiResponse_1.errorResponse)(res, "Project not found", 404);
        }
        if (project.owner.toString() !== requesterId) {
            return (0, apiResponse_1.errorResponse)(res, "Only the project owner can delete this project", 403);
        }
        await Project_1.Project.findByIdAndDelete(req.params.id);
        (0, apiResponse_1.successResponse)(res, null, "Project deleted");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to delete project", 500, err);
    }
};
exports.deleteProject = deleteProject;
