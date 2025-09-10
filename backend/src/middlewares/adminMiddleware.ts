import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/apiResponse";

// isAdmin.ts - check if current user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if(!req.user){
    return sendError(res, "Not authenticated", 401);
  }
  if (req.user.role !== "admin") {
    return sendError(res, "Access denied. Admin privileges required.", 403);
  }
  next();
};
