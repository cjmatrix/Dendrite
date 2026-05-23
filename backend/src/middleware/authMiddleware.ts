import { Request, Response, NextFunction } from 'express';
import { IUserRepository } from '../domain/auth/repositories/IUserRepository';
import { IAuthService } from '../domain/auth/services/IAuthService';
import { injectable, inject, container } from 'tsyringe';

@injectable()
export class AuthMiddleware {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IAuthService") private authService: IAuthService
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

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized: Invalid Token" });
    }
  };
}

export const authMiddleware = container.resolve(AuthMiddleware);
export const userProtect = authMiddleware.protect;
