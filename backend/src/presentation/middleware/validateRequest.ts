import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { AppError } from "../../utils/AppError";

const formatZodError = (error: ZodError) =>
  error.issues.map((issue) => issue.message).join(", ");

export const validateBody = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError(formatZodError(result.error), 400));
    }
    req.body = result.data;
    return next();
  };

export const validateQuery = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new AppError(formatZodError(result.error), 400));
    }
    Object.assign(req.query, result.data as any);
    return next();
  };

export const validateParams = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new AppError(formatZodError(result.error), 400));
    }
    Object.assign(req.params, result.data as any);
    return next();
  };

export const validatePasswordConfirmation = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const { password, confirmPassword } = req.body || {};
  if (password !== confirmPassword) {
    return next(new AppError("Passwords do not match", 400));
  }
  return next();
};