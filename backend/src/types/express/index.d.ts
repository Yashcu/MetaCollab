// src/types/express/index.d.ts

// Reason: Use path alias for a stable, non-relative import path.
import { IUser } from '@/models/User';

// Reason: Renamed to be more descriptive. This is the payload from the JWT.
// It's a subset of the full IUser model for performance and consistency.
export interface UserPayload {
  userId: string;
  role: 'user' | 'admin';
  name: string;
  email: string;
  avatarUrl: string;
}

declare global {
  namespace Express {
    export interface Request {
      // Reason: The 'user' property will now always have this consistent shape after
      // the auth middleware runs, simplifying logic in all downstream controllers.
      user?: UserPayload;
    }
  }
}
