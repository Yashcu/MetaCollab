"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
/**
 * AppError - Custom Error class for the backend
 * Extends the native Error object with HTTP status codes
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Call parent constructor
        this.statusCode = statusCode;
        this.isOperational = true; // distinguish operational errors vs programming errors
        this.name = this.constructor.name;
        // Captures stack trace (excluding constructor)
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
