import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { errorResponse } from "../utils/apiResponse";

// Protect middleware
export const protect = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return errorResponse(res, "Not authorized, no token", 401);

  try {
    const decoded = jwt.verify(token, config.jwtSecret as string) as { userId: string; role: 'user' | 'admin' };
    req.user = decoded;
    next();
  } catch (err) {
    return errorResponse(res, "Token invalid or expired", 401);
  }
};
