"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
/**
 * AppError - Custom Error class for backend
 * Extends native Error with HTTP status codes
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.isOperational = true;
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=appError.js.map