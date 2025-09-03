import { Request, Response } from "express";
import { Project } from "../models/Project";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { Task } from "../models/Task";
import { User } from "../models/User";

// Create a project
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!req.user || !('userId' in req.user)) {
      return errorResponse(res, "Not authorized", 401);
    }
    const owner = req.user.userId;

    // When creating a project, the owner is also a member by default
    const project = await Project.create({ name, description, owner, members: [owner] });
    successResponse(res, project, "Project created", 201);
  } catch (err) {
    errorResponse(res, "Failed to create project", 500, err);
  }
};

export const getTasksByProjectId = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId })
      .sort('order')
      .populate("assignee", "name");
    successResponse(res, tasks, "Tasks for project fetched");
  } catch (err) {
    errorResponse(res, "Failed to fetch tasks for project", 500, err);
  }
};

// Get all projects
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    if (!req.user || !('userId' in req.user)) {
      return errorResponse(res, "Not authorized", 401);
    }
    const userId = req.user.userId;

    // FIX: Removed the second argument from populate to get full user objects
    const projects = await Project.find({ members: userId }).populate("owner members");
    successResponse(res, projects, "Projects fetched");
  } catch (err) {
    errorResponse(res, "Failed to fetch projects", 500, err);
  }
};

// Get project by ID
// ... (imports and other functions)

// Get project by ID
export const getProjectById = async (req: Request, res: Response) => {
  try {
    if (!req.user || !('userId' in req.user)) {
      return errorResponse(res, "Not authorized", 401);
    }
    const userId = req.user.userId;

    const project = await Project.findById(req.params.id);

    if (!project || !project.members.some(memberId => memberId.toString() === userId)) {
      return errorResponse(res, "Project not found or access denied", 404);
    }

    // If the check passes, populate the fields and send the response.
    const populatedProject = await project.populate("owner members");
    successResponse(res, populatedProject, "Project fetched");

  } catch (err) {
    errorResponse(res, "Failed to fetch project", 500, err);
  }
};

export const addMemberToProject = async (req: Request, res: Response) => {
    try {
        if (!req.user || !('userId' in req.user)) {
            return errorResponse(res, "Not authorized", 401);
        }
        const requesterId = req.user.userId;
        const { projectId } = req.params;
        const { email } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return errorResponse(res, "Project not found", 404);
        }

        // Security Check: Only the project owner can add members
        if (project.owner.toString() !== requesterId) {
            return errorResponse(res, "Only the project owner can add members", 403);
        }

        const userToAdd = await User.findOne({ email });
        if (!userToAdd) {
            return errorResponse(res, "User with that email not found", 404);
        }

        // Add user to members array if not already present
        await Project.findByIdAndUpdate(projectId, { $addToSet: { members: userToAdd._id } });

        const updatedProject = await Project.findById(projectId).populate("owner members", "name email");

        successResponse(res, updatedProject, "Member added successfully");

    } catch (err) {
        errorResponse(res, "Failed to add member", 500, err);
    }
}

// Update project
export const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return errorResponse(res, "Project not found", 404);
    successResponse(res, project, "Project updated");
  } catch (err) {
    errorResponse(res, "Failed to update project", 500, err);
  }
};

// Delete project
// ... (imports and other functions)

// Delete project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    if (!req.user || !('userId' in req.user)) {
        return errorResponse(res, "Not authorized", 401);
    }
    const requesterId = req.user.userId;
    const project = await Project.findById(req.params.id);

    if (!project) {
        return errorResponse(res, "Project not found", 404);
    }

    if (project.owner.toString() !== requesterId) {
        return errorResponse(res, "Only the project owner can delete this project", 403);
    }

    await Project.findByIdAndDelete(req.params.id);
    successResponse(res, null, "Project deleted");
  } catch (err) {
    errorResponse(res, "Failed to delete project", 500, err);
  }
};
