/**
 * AppError - Custom Error class for backend
 * Extends native Error with HTTP status codes
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean = true;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.name = this.constructor.name;


    Error.captureStackTrace(this, this.constructor);
  }
}
