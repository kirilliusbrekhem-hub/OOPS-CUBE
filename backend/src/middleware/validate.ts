import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from './errorHandler';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ApiError(400, 'validation_error', result.error.issues[0]?.message ?? 'Invalid request body'));
      return;
    }
    req.body = result.data;
    next();
  };
}
