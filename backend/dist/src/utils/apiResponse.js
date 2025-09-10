"use strict";
// An alternative way to structure apiResponse.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
class ApiResponse {
    constructor(success, message, data, errors) {
        this.success = success;
        this.message = message;
        if (data)
            this.data = data;
        if (errors)
            this.errors = errors;
    }
}
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    const response = new ApiResponse(true, message, data);
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message = 'Error', statusCode = 500, errors) => {
    const response = new ApiResponse(false, message, undefined, errors);
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
//# sourceMappingURL=apiResponse.js.map