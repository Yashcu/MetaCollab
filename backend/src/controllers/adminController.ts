import { Request, Response } from "express";
import { User } from "../models/User";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { successResponse, errorResponse } from "../utils/apiResponse";

// Get dashboard statistics
export const getStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const tasksCompleted = await Task.countDocuments({ status: "done" });

    successResponse(res, { totalUsers, totalProjects, tasksCompleted }, "Stats fetched");
  } catch (err) {
    errorResponse(res, "Failed to fetch stats", 500, err);
  }
};
