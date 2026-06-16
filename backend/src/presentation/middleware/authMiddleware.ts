import { Request, Response, NextFunction } from 'express';
import { IUserRepository } from '../../domain/auth/repositories/IUserRepository';
import { IAuthService } from '../../domain/auth/services/IAuthService';
import { ICacheService } from '../../application/common/ports/ICacheService';
import { injectable, inject, container } from 'tsyringe';

@injectable()
export class AuthMiddleware {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IAuthService") private authService: IAuthService,
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  public protect = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No Token Provided" });
    }

    try {
      const decoded = this.authService.verifyAccessToken(token) as { userId: string };

      const user = await this.userRepository.findByIdSafe(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
      }

      if(user.status==="suspended"){
         const isSuspended = await this.cacheService.exists(`suspend:${decoded.userId}`);
        if (isSuspended) {
        return res.status(403).json({ message: "Forbidden: Your account is currently suspended" });
        }
      
        await this.userRepository.findByIdAndUpdate(decoded.userId,{status:"active"})
        user.status = "active"; 
      }

      if (user.status !== "active") {
        console.log(user)
        return res.status(403).json({ message: "Forbidden: Account is inactive or pending verification" });
      }


      req.user = user;


      


      next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized: Invalid Token" });
    }
  };
}

export const authMiddleware = container.resolve(AuthMiddleware);
export const userProtect = authMiddleware.protect;

@injectable()
export class AdminMiddleware {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IAuthService") private authService: IAuthService,
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  public protect = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.adminAccessToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No Admin Token Provided" });
    }

    try {
      const decoded = this.authService.verifyAccessToken(token) as { userId: string };

      const user = await this.userRepository.findByIdSafe(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
      }

      if (user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admins only" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ message: "Forbidden: Account is inactive" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized: Invalid Admin Token" });
    }
  };
}

export const adminMiddleware = container.resolve(AdminMiddleware);
export const adminProtect = adminMiddleware.protect;
