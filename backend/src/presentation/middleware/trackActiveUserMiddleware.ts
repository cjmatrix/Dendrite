import { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import { IActiveUserTracker } from "../../application/common/ports/IActiveUserTracker";
import { IAuthService } from "../../domain/auth/services/IAuthService";

export const trackActiveUserMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const tracker = container.resolve<IActiveUserTracker>("IActiveUserTracker");
    let userId = "";
    if (req.cookies?.accessToken) {
      try {
        const authService = container.resolve<IAuthService>("IAuthService");
        const decoded = authService.verifyAccessToken(req.cookies.accessToken) as { userId: string };
        userId = decoded?.userId || "";
      } catch {}
    }
    const trackId = userId || req.ip;
    if (trackId) {
      tracker.trackActive(trackId).catch(() => {});
    }
  } catch (error) {
   
  }
  next();
};
