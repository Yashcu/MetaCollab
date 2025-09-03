import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/apiResponse";

// Middleware to check if the user has an 'admin' role
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && 'role' in req.user && req.user.role === 'admin') {
    next();
  } else {
    return errorResponse(res, "Access denied. Admin privileges required.", 403);
  }
};
