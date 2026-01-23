import { Request } from "express";
import { UserPayload } from "../../types/express";

export interface AuthRequest extends Request {
  user?: UserPayload;
}
