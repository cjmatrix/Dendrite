import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../utils/tokenUtils';
import { AppError } from '../../../utils/AppError';

export class RefreshTokenUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(refreshToken: string) {
    let decoded: any;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid refresh token', 403);
    }

    const user = await this.userRepository.findById(decoded.userId);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      if (user) {
        // Compromised token detected, clear all tokens to re-login user
        await this.userRepository.clearRefreshTokens(user._id.toString());
      }
      throw new AppError('Compromised Token', 403);
    }

    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    await this.userRepository.replaceRefreshToken(user._id.toString(), refreshToken, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
