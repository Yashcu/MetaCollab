// An alternative way to structure apiResponse.ts

import { Response } from 'express';

class ApiResponse<T> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data?: T;
  public readonly errors?: unknown;

  constructor(success: boolean, message: string, data?: T, errors?: unknown) {
    this.success = success;
    this.message = message;
    if (data) this.data = data;
    if (errors) this.errors = errors;
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
) => {
  const response = new ApiResponse(true, message, data);
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message = 'Error',
  statusCode = 500,
  errors?: unknown
) => {
  const response = new ApiResponse(false, message, undefined, errors);
  return res.status(statusCode).json(response);
};
