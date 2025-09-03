import { Request, Response, NextFunction } from "express";
import { errorResponse } from "./apiResponse";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  errorResponse(res, message, statusCode, err.errors);
};
