"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTaskById = exports.getAllTasks = exports.createTask = void 0;
const Task_1 = require("../models/Task");
const apiResponse_1 = require("../utils/apiResponse");
// Create task
const createTask = async (req, res) => {
    try {
        const { title, description, status } = req.body;
        const { projectId } = req.params;
        const task = await Task_1.Task.create({
            title,
            description,
            status,
            project: projectId
        });
        (0, apiResponse_1.successResponse)(res, task, "Task created", 201);
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to create task", 500, err);
    }
};
exports.createTask = createTask;
// Get all tasks
const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task_1.Task.find().populate("project assignee");
        (0, apiResponse_1.successResponse)(res, tasks, "Tasks fetched");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to fetch tasks", 500, err);
    }
};
exports.getAllTasks = getAllTasks;
// Get task by ID
const getTaskById = async (req, res) => {
    try {
        const task = await Task_1.Task.findById(req.params.id).populate("project assignee");
        if (!task)
            return (0, apiResponse_1.errorResponse)(res, "Task not found", 404);
        (0, apiResponse_1.successResponse)(res, task, "Task fetched");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to fetch task", 500, err);
    }
};
exports.getTaskById = getTaskById;
// Update task
const updateTask = async (req, res) => {
    try {
        const task = await Task_1.Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!task)
            return (0, apiResponse_1.errorResponse)(res, "Task not found", 404);
        (0, apiResponse_1.successResponse)(res, task, "Task updated");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to update task", 500, err);
    }
};
exports.updateTask = updateTask;
// Delete task
const deleteTask = async (req, res) => {
    try {
        const task = await Task_1.Task.findByIdAndDelete(req.params.id);
        if (!task)
            return (0, apiResponse_1.errorResponse)(res, "Task not found", 404);
        (0, apiResponse_1.successResponse)(res, null, "Task deleted");
    }
    catch (err) {
        (0, apiResponse_1.errorResponse)(res, "Failed to delete task", 500, err);
    }
};
exports.deleteTask = deleteTask;
