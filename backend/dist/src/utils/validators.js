"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskValidator = exports.addMemberValidator = exports.projectValidator = exports.changePasswordValidator = exports.updateProfileValidator = exports.loginValidator = exports.signupValidator = void 0;
// src/utils/validators.ts
const express_validator_1 = require("express-validator");
// --- Reusable Individual Validators ---
const nameValidator = (0, express_validator_1.body)("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required");
const emailValidator = (0, express_validator_1.body)("email")
    .trim()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail();
const passwordValidator = (0, express_validator_1.body)("password")
    .notEmpty()
    .withMessage("Password is required");
// --- Assembled Validator Chains ---
exports.signupValidator = [
    nameValidator,
    emailValidator,
    passwordValidator // Or use strongPasswordValidator for better security
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
];
exports.loginValidator = [
    emailValidator,
    passwordValidator,
];
exports.updateProfileValidator = [
    (0, express_validator_1.body)("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    (0, express_validator_1.body)("avatarUrl").optional().trim().isURL().withMessage("Avatar URL must be a valid URL"),
];
exports.changePasswordValidator = [
    (0, express_validator_1.body)("currentPassword").notEmpty().withMessage("Current password is required"),
    (0, express_validator_1.body)("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters long"),
];
exports.projectValidator = [
    (0, express_validator_1.body)("name").trim().notEmpty().withMessage("Project name is required"),
    (0, express_validator_1.body)("description").optional().trim(),
];
exports.addMemberValidator = [
    (0, express_validator_1.body)("email").isEmail().withMessage("A valid email is required to add a member").normalizeEmail(),
];
exports.taskValidator = [
    (0, express_validator_1.body)("title").trim().notEmpty().withMessage("Task title is required"),
    (0, express_validator_1.body)("status").optional().isIn(["todo", "in-progress", "done"]).withMessage("Invalid status"),
];
//# sourceMappingURL=validators.js.map