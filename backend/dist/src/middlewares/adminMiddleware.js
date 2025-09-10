"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const apiResponse_1 = require("../utils/apiResponse");
// isAdmin.ts - check if current user is admin
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return (0, apiResponse_1.sendError)(res, "Not authenticated", 401);
    }
    if (req.user.role !== "admin") {
        return (0, apiResponse_1.sendError)(res, "Access denied. Admin privileges required.", 403);
    }
    next();
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=adminMiddleware.js.map