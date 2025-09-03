import { Request, Response } from "express";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { User } from "../models/User";
import { Project } from "../models/Project";

// Get global leaderboard
export const getGlobalLeaderboard = async (req: Request, res: Response) => {
  try {
    const leaderboard = await User.find().sort({ points: -1 }).limit(10).select("name points avatarUrl");
    successResponse(res, leaderboard, "Global leaderboard fetched");
  } catch (err) {
    errorResponse(res, "Failed to fetch global leaderboard", 500, err);
  }
};

// Get project-specific leaderboard
export const getProjectLeaderboard = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate<{ members: any[] }>('members');
    if (!project) {
        return errorResponse(res, "Project not found", 404);
    }

    const memberIds = project.members.map(member => member._id);

    const leaderboard = await User.find({
        '_id': { $in: memberIds }
    }).sort({ points: -1 }).limit(10).select("name points avatarUrl");

    successResponse(res, leaderboard, `Leaderboard for project ${projectId} fetched`);
  } catch (err) {
    errorResponse(res, "Failed to fetch project leaderboard", 500, err);
  }
};
