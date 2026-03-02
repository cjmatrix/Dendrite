import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Server error';
  let status = 'error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    status = err.status;
  } else {
    
    console.error('UNEXPECTED ERROR:', err);
   
    if (process.env.NODE_ENV !== 'production') {
       message = err.message;
    }
  }

  res.status(statusCode).json({
    status,
    message,
  });
};
