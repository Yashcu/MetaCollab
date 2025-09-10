import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { sendError } from "../utils/apiResponse";
import { UserPayload } from "@/types/express";
import { User } from "@/models/User";

// authMiddleware.ts - protect routes using JWT
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Not authorized, no token", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.JWT_SECRET) as UserPayload;

    const currentUser = await User.findById(decoded.userId);

    if(!currentUser){
      return sendError(res, "The user belonging to this token no longer exists.", 401);    return sendError(res, "The user belonging to this token no longer exists.", 401);
    }

    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, "Token invalid or expired", 401);
  }
};
