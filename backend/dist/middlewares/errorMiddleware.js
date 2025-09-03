"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.globalErrorHandler = void 0;
const appError_1 = require("../utils/appError");
const apiResponse_1 = require("../utils/apiResponse");
/**
 * Global error handling middleware
 * Catches all errors and sends a consistent API response
 */
const globalErrorHandler = (err, req, res, next) => {
    // If the error is an instance of AppError, use its status and message
    if (err instanceof appError_1.AppError) {
        return (0, apiResponse_1.errorResponse)(res, err.message, err.statusCode, err.stack);
    }
    // For validation or mongoose errors, customize the message
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((val) => val.message);
        return (0, apiResponse_1.errorResponse)(res, messages.join(", "), 400);
    }
    if (err.name === "MongoServerError" && err.code === 11000) {
        // Duplicate key error
        const field = Object.keys(err.keyValue)[0];
        return (0, apiResponse_1.errorResponse)(res, `Duplicate field value: ${field}`, 400);
    }
    // Default to 500 Internal Server Error
    console.error(err); // log for debugging
    return (0, apiResponse_1.errorResponse)(res, "Internal Server Error", 500, err.stack);
};
exports.globalErrorHandler = globalErrorHandler;
/**
 * Catch unhandled routes
 */
const notFoundHandler = (req, res, next) => {
    return (0, apiResponse_1.errorResponse)(res, `Cannot find ${req.originalUrl} on this server`, 404);
};
exports.notFoundHandler = notFoundHandler;
