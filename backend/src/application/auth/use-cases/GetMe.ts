import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import { AppError } from '../../../utils/AppError';

export class GetMe {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    const { password: _, refreshTokens: __, ...safeUser } = user.toObject();
    return safeUser;
  }
}
