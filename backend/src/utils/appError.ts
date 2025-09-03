/**
 * AppError - Custom Error class for the backend
 * Extends the native Error object with HTTP status codes
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message); // Call parent constructor

    this.statusCode = statusCode;
    this.isOperational = true; // distinguish operational errors vs programming errors
    this.name = this.constructor.name;

    // Captures stack trace (excluding constructor)
    Error.captureStackTrace(this, this.constructor);
  }
}
