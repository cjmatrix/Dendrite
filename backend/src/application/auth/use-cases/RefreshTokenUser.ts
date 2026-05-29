import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import { IAuthService } from '../../../domain/auth/services/IAuthService';
import { ICacheService } from '../../../application/common/ports/ICacheService';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from "tsyringe";
import { IRefreshTokenUserUseCase } from "./interfaces";

@injectable()
export class RefreshTokenUser implements IRefreshTokenUserUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IAuthService") private authService: IAuthService,
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async execute(refreshToken: string) {
    let decoded: any;
    try {
      decoded = this.authService.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid refresh token', 403);
    }

    
    const storedUserId = await this.cacheService.get(`refresh_token:${refreshToken}`);
    if (!storedUserId || storedUserId !== decoded.userId) {
      throw new AppError('Invalid or expired refresh token', 403);
    }

    const user = await this.userRepository.findById(decoded.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newAccessToken = this.authService.generateAccessToken(user._id.toString());
    const newRefreshToken = this.authService.generateRefreshToken(user._id.toString());

    
    await this.cacheService.del(`refresh_token:${refreshToken}`);
    await this.cacheService.set(`refresh_token:${newRefreshToken}`, user._id.toString(), { EX: 604800 });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
