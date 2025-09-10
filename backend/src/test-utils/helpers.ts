import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { User } from '../models/User';

// Helper to convert expiry string to seconds, mirroring the controller logic
const getExpiryInSeconds = (expiryStr: string): number => {
  const unit = expiryStr.slice(-1);
  const value = parseInt(expiryStr.slice(0, -1), 10);
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 86400;
  }
};

export const getAuthAgent = async () => {
  const agent = request(app);
  const uniqueId = new mongoose.Types.ObjectId();

  const userData = {
    _id: uniqueId,
    name: `Test User ${uniqueId}`,
    email: `test${uniqueId}@example.com`,
    password: 'password123',
    role: 'user',
  };

  const user = await User.create(userData);

  const payload = {
    userId: user._id.toString(),
    name: user.name,
    role: user.role,
    email: user.email,
  };

  const token = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: getExpiryInSeconds(config.JWT_EXPIRES_IN),
  });

  const userJson = user.toJSON();

  return { agent, user: userJson, token };
};
