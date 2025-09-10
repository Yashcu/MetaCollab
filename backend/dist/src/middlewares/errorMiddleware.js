"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.globalErrorHandler = void 0;
const config_1 = require("../config/config");
const appError_1 = require("../utils/appError");
const apiResponse_1 = require("../utils/apiResponse");
// --- Type Guards to safely check error types ---
const isValidationError = (err) => {
    return err?.name === 'ValidationError';
};
const isMongoServerError = (err) => {
    return err?.name === 'MongoServerError' && err?.code === 11000;
};
// --- Main Global Error Handler ---
const globalErrorHandler = (err, _req, res, _next) => {
    let reportableError;
    if (err instanceof appError_1.AppError) {
        reportableError = err;
    }
    else if (isValidationError(err)) {
        const messages = Object.values(err.errors).map((val) => val.message);
        reportableError = new appError_1.AppError(messages.join(". "), 400);
    }
    else if (isMongoServerError(err)) {
        const field = Object.keys(err.keyValue)[0];
        const message = `An account with that ${field} already exists.`;
        reportableError = new appError_1.AppError(message, 400);
    }
    else {
        console.error("💥 UNHANDLED ERROR", err);
        reportableError = new appError_1.AppError("Something went very wrong on our end.", 500);
    }
    // --- Send Response Based on Environment ---
    if (config_1.config.NODE_ENV === 'development') {
        // In development, send a detailed error
        return (0, apiResponse_1.sendError)(res, reportableError.message, reportableError.statusCode, {
            stack: reportableError.stack
        });
    }
    else {
        // In production, send a clean, user-friendly error
        if (reportableError.isOperational) {
            return (0, apiResponse_1.sendError)(res, reportableError.message, reportableError.statusCode);
        }
        return (0, apiResponse_1.sendError)(res, "Something went very wrong on our end.", 500);
    }
};
exports.globalErrorHandler = globalErrorHandler;
// --- 404 Not Found Handler ---
const notFoundHandler = (req, _res, next) => {
    const err = new appError_1.AppError(`Cannot find ${req.originalUrl} on this server`, 404);
    next(err);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorMiddleware.js.map