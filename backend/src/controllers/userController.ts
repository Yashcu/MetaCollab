import { Request, Response } from "express";
import { User } from "../models/User";
import { successResponse, errorResponse } from "../utils/apiResponse";
import bcrypt from "bcryptjs";

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    successResponse(res, users, "Users fetched");
  } catch (err) {
    errorResponse(res, "Failed to fetch users", 500, err);
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return errorResponse(res, "User not found", 404);
    successResponse(res, user, "User fetched");
  } catch (err) {
    errorResponse(res, "Failed to fetch user", 500, err);
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { name, email, avatarUrl } = req.body;
    const updateData: any = { name, email, avatarUrl };

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");
    if (!user) return errorResponse(res, "User not found", 404);
    successResponse(res, user, "User updated");
  } catch (err) {
    errorResponse(res, "Failed to update user", 500, err);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || !user.password) return errorResponse(res, "User not found", 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return errorResponse(res, "Incorrect current password", 400);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    successResponse(res, null, "Password updated successfully");
  } catch (err) {
    errorResponse(res, "Failed to update password", 500, err);
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return errorResponse(res, "User not found", 404);
    successResponse(res, null, "User deleted");
  } catch (err) {
    errorResponse(res, "Failed to delete user", 500, err);
  }
};
