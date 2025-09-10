import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"; // Import is needed
import { User, IUser } from "../models/User";
import { config } from "../config/config";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/appError";

const getExpiryInSeconds = (expiryStr: string): number => {
  const unit = expiryStr.slice(-1);
  const value = parseInt(expiryStr.slice(0, -1), 10);
  if (isNaN(value)) return 86400;

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 86400;
  }
};

const generateToken = (user: IUser): string => {
  const payload = {
    userId: user._id.toString(),
    name: user.name,
    role: user.role,
    email: user.email,
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: getExpiryInSeconds(config.JWT_EXPIRES_IN),
  });
};

export const signup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with that email already exists.', 400));
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user);
  sendSuccess(res, { token, user }, "User created successfully", 201);
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Invalid email or password", 401));
  }

  const token = generateToken(user);
  sendSuccess(res, { token, user }, "Login successful");
});
