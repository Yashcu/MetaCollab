"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const apiResponse_1 = require("./apiResponse");
const errorHandler = (err, req, res, next) => {
    console.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    (0, apiResponse_1.errorResponse)(res, message, statusCode, err.errors);
};
exports.errorHandler = errorHandler;
