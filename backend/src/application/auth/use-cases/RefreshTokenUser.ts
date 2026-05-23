import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import { IAuthService } from '../../../domain/auth/services/IAuthService';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from "tsyringe";

@injectable()
export class RefreshTokenUser {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IAuthService") private authService: IAuthService
  ) {}

  async execute(refreshToken: string) {
    let decoded: any;
    try {
      decoded = this.authService.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid refresh token', 403);
    }

    const user = await this.userRepository.findById(decoded.userId);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      if (user) {
        // Compromised token 
        await this.userRepository.clearRefreshTokens(user._id.toString());
      }
      throw new AppError('Compromised Token', 403);
    }

    const newAccessToken = this.authService.generateAccessToken(user._id.toString());
    const newRefreshToken = this.authService.generateRefreshToken(user._id.toString());

    await this.userRepository.replaceRefreshToken(user._id.toString(), refreshToken, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
