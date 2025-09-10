import { Request, Response, NextFunction } from "express";
import { config } from "../config/config";
import { AppError } from "../utils/appError";
import { sendError } from "../utils/apiResponse";

// --- Type Guards to safely check error types ---
const isValidationError = (err: any): err is { name: 'ValidationError'; errors: { [key: string]: { message: string } } } => {
  return err?.name === 'ValidationError';
}

const isMongoServerError = (err: any): err is { name: 'MongoServerError'; code: number; keyValue: object } => {
  return err?.name === 'MongoServerError' && err?.code === 11000;
}

// --- Main Global Error Handler ---
export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let reportableError: AppError;

  if (err instanceof AppError) {
    reportableError = err;
  } else if (isValidationError(err)) {
    const messages = Object.values(err.errors).map((val) => val.message);
    reportableError = new AppError(messages.join(". "), 400);
  } else if (isMongoServerError(err)) {
    const field = Object.keys(err.keyValue)[0];
    const message = `An account with that ${field} already exists.`;
    reportableError = new AppError(message, 400);
  } else {
    console.error("💥 UNHANDLED ERROR", err);
    reportableError = new AppError("Something went very wrong on our end.", 500);
  }

  // --- Send Response Based on Environment ---
  if (config.NODE_ENV === 'development') {
    // In development, send a detailed error
    return sendError(res, reportableError.message, reportableError.statusCode, {
      stack: reportableError.stack
    });
  } else {
    // In production, send a clean, user-friendly error
    if (reportableError.isOperational) {
        return sendError(res, reportableError.message, reportableError.statusCode);
    }
    return sendError(res, "Something went very wrong on our end.", 500);
  }
};


// --- 404 Not Found Handler ---
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const err = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(err);
};
