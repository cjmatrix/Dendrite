import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import { verifyRefreshToken } from '../../../utils/tokenUtils';

export class LogoutUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(refreshToken: string) {
    try {
      const decoded: any = verifyRefreshToken(refreshToken);
      if (decoded && decoded.userId) {
        await this.userRepository.removeRefreshToken(decoded.userId, refreshToken);
      }
    } catch(err) {
       // Ignore verification error on logout
    }
  }
}
