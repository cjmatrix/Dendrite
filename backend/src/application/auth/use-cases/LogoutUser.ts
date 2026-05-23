import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import { IAuthService } from '../../../domain/auth/services/IAuthService';
import { injectable, inject } from "tsyringe";

@injectable()
export class LogoutUser {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IAuthService") private authService: IAuthService
  ) {}

  async execute(refreshToken: string) {
    try {
      const decoded: any = this.authService.verifyRefreshToken(refreshToken);
      if (decoded && decoded.userId) {
        await this.userRepository.removeRefreshToken(decoded.userId, refreshToken);
      }
    } catch(err) {
      
    }
  }
}
