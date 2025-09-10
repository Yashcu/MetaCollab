import { Request, Response, NextFunction } from "express";
import { validationResult , Result, ValidationError} from "express-validator";
import { sendError } from "../utils/apiResponse";

// validationMiddleware.ts - validate request using express-validator
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors: Result<ValidationError> = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(res, "Validation failed", 400, errors.array());
  }
  next();
};
