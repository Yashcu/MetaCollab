// src/utils/validators.ts
import { body, ValidationChain } from "express-validator";

// --- Reusable Individual Validators ---
const nameValidator = body("name")
  .trim()
  .notEmpty()
  .withMessage("Name is required");

const emailValidator = body("email")
  .trim()
  .isEmail()
  .withMessage("A valid email is required")
  .normalizeEmail();

const passwordValidator = body("password")
  .notEmpty()
  .withMessage("Password is required");


// --- Assembled Validator Chains ---
export const signupValidator: ValidationChain[] = [
  nameValidator,
  emailValidator,
  passwordValidator // Or use strongPasswordValidator for better security
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const loginValidator: ValidationChain[] = [
  emailValidator,
  passwordValidator,
];

export const updateProfileValidator: ValidationChain[] = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("avatarUrl").optional().trim().isURL().withMessage("Avatar URL must be a valid URL"),
];

export const changePasswordValidator: ValidationChain[] = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

export const projectValidator: ValidationChain[] = [
  body("name").trim().notEmpty().withMessage("Project name is required"),
  body("description").optional().trim(),
];

export const addMemberValidator: ValidationChain[] = [
  body("email").isEmail().withMessage("A valid email is required to add a member").normalizeEmail(),
];

export const taskValidator: ValidationChain[] = [
  body("title").trim().notEmpty().withMessage("Task title is required"),
  body("status").optional().isIn(["todo", "in-progress", "done"]).withMessage("Invalid status"),
];
