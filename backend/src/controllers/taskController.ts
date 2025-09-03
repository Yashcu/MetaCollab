import { Request, Response } from "express";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { successResponse, errorResponse } from "../utils/apiResponse";

// Create task
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status } = req.body;
    const { projectId } = req.params;

    const task = await Task.create({
      title,
      description,
      status,
      project: projectId
    });
    successResponse(res, task, "Task created", 201);
  } catch (err) {
    errorResponse(res, "Failed to create task", 500, err);
  }
};

export const reorderTasks = async (req: Request, res: Response) => {
  try {
    const updates = req.body.tasks; // Expecting an array of { id, order, status }
    if (!updates || !Array.isArray(updates)) {
      return errorResponse(res, "Invalid payload", 400);
    }

    const bulkOps = updates.map(task => ({
      updateOne: {
        filter: { _id: task.id },
        update: { $set: { order: task.order, status: task.status } },
      },
    }));

    await Task.bulkWrite(bulkOps);
    successResponse(res, null, "Tasks reordered successfully");
  } catch (err) {
    errorResponse(res, "Failed to reorder tasks", 500, err);
  }
};

// Get all tasks
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find().populate("project assignee");
    successResponse(res, tasks, "Tasks fetched");
  } catch (err) {
    errorResponse(res, "Failed to fetch tasks", 500, err);
  }
};

// Get task by ID
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id).populate("project assignee");
    if (!task) return errorResponse(res, "Task not found", 404);
    successResponse(res, task, "Task fetched");
  } catch (err) {
    errorResponse(res, "Failed to fetch task", 500, err);
  }
};

// Update task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return errorResponse(res, "Task not found", 404);

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    successResponse(res, updatedTask, "Task updated");
  } catch (err) {
    errorResponse(res, "Failed to update task", 500, err);
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return errorResponse(res, "Task not found", 404);
    successResponse(res, null, "Task deleted");
  } catch (err) {
    errorResponse(res, "Failed to delete task", 500, err);
  }
};
