"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const apiResponse_1 = require("../utils/apiResponse");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return (0, apiResponse_1.errorResponse)(res, "Validation failed", 400, errors.array());
    next();
};
exports.validateRequest = validateRequest;
