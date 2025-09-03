// src/types/express/index.d.ts
import { IUser } from "../../models/User";

// Define a custom user type that includes the role for our middleware
type CustomUser = { userId: string; role: 'user' | 'admin' } | IUser;

declare global {
  namespace Express {
    export interface Request {
      user?: CustomUser;
    }
  }
}
