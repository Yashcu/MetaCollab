import { Request, Response } from "express";
import { User } from "../models/User";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { sendSuccess, sendError } from "../utils/apiResponse";

// Helper type guard for req.user
const isUserWithId = (user: any): user is { userId: string; role: 'user' | 'admin' } => {
  return user && typeof user.userId === "string" && 'role' in user;
};

// - getStats: counts total users, total projects, tasks completed
export const getStats = async (req: Request, res: Response) => {
  try {
    if (!isUserWithId(req.user) || req.user.role !== 'admin') {
      return sendError(res, "Access denied. Admins only.", 403);
    }

    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const tasksCompleted = await Task.countDocuments({ status: "done" });

    sendSuccess(
      res,
      { totalUsers, totalProjects, tasksCompleted },
      "Dashboard stats fetched successfully"
    );
  } catch (err) {
    sendError(res, "Failed to fetch stats", 500, err);
  }
};
