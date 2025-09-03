import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { errorResponse } from "../utils/apiResponse";

/**
 * Global error handling middleware
 * Catches all errors and sends a consistent API response
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If the error is an instance of AppError, use its status and message
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.stack);
  }

  // For validation or mongoose errors, customize the message
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    return errorResponse(res, messages.join(", "), 400);
  }

  if (err.name === "MongoServerError" && err.code === 11000) {
    // Duplicate key error
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, `Duplicate field value: ${field}`, 400);
  }

  // Default to 500 Internal Server Error
  console.error(err); // log for debugging
  return errorResponse(res, "Internal Server Error", 500, err.stack);
};

/**
 * Catch unhandled routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  return errorResponse(res, `Cannot find ${req.originalUrl} on this server`, 404);
};
