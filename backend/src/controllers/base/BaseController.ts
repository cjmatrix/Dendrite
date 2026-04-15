import { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';


export abstract class BaseController {

  protected validateUserAuth(req: Request): string {
    if (!req.user || !req.user._id) {
      throw new AppError('Unauthorized', 401);
    }
    return req.user._id.toString();
  }

  protected sendSuccess(
    res: Response,
    data: any,
    statusCode: number = 200,
    message?: string,
  ): void {
    res.status(statusCode).json({
      success: true,
      ...(message && { message }),
      data,
    });
  }

  
  protected sendError(
    res: Response,
    error: any,
    statusCode: number = 500,
  ): void {
    const message = error instanceof AppError ? error.message : 'Internal server error';
    const code = error instanceof AppError ? error.statusCode : statusCode;

    res.status(code).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { error: error.stack }),
    });
  }

 
  protected getQueryParam(
    req: Request,
    paramName: string,
    defaultValue?: string,
  ): string | undefined {
    const value = req.query[paramName] as string;
    return value || defaultValue;
  }

  protected getRouteParam(req: Request, paramName: string): string {
    const value = req.params[paramName];
    if (!value) {
      throw new AppError(`Missing required parameter: ${paramName}`, 400);
    }
    return value as string;
  }

  protected asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: Function) => {
      Promise.resolve(fn(req, res)).catch((err) => {
        this.sendError(res, err);
      });
    };
  }
}
