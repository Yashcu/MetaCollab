import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";
import { config } from "../config/config";
import { successResponse, errorResponse } from "../utils/apiResponse";

const parseExpiry = (str: string): number => {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 86400;
  const [, numStr, unit] = match;
  const num = parseInt(numStr, 10);
  const unitMap: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return num * (unitMap[unit] || 86400);
};

const generateToken = (user: IUser) => {
  const payload = { userId: user._id.toString(), name: user.name, role: user.role };
  const options: jwt.SignOptions = {
    expiresIn: parseExpiry(config.jwtExpiresIn),
  };
  return jwt.sign(payload, config.jwtSecret as string, options);
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return errorResponse(res, "User already exists", 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const userResponse = { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl };
    const token = generateToken(user);
    successResponse(res, { token, user: userResponse }, "User created", 201);
  } catch (err) {
    errorResponse(res, "Signup failed", 500, err);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return errorResponse(res, "Invalid credentials", 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return errorResponse(res, "Invalid credentials", 401);

    const token = generateToken(user);
    const userResponse = { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl };
    successResponse(res, { token, user: userResponse }, "Login successful");
  } catch (err) {
    errorResponse(res, "Login failed", 500, err);
  }
};

export const oauthCallback = (req: Request, res: Response) => {
  const user = req.user as IUser;
  const token = generateToken(user);
  const userResponse = { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl };
  successResponse(res, { token, user: userResponse }, "Login successful");
};
