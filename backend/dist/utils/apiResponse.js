"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, data, message = "Success", code = 200) => {
    return res.status(code).json({ success: true, message, data });
};
exports.successResponse = successResponse;
const errorResponse = (res, message = "Error", code = 500, errors) => {
    return res.status(code).json({ success: false, message, errors });
};
exports.errorResponse = errorResponse;
