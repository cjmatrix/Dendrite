import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import { generateAccessToken, generateRefreshToken } from '../../../utils/tokenUtils';
import { AppError } from '../../../utils/AppError';

export class LoginUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(userData: any) {
    const { email, password } = userData;
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    await this.userRepository.addRefreshToken(user._id.toString(), refreshToken);

    const { password: _, refreshTokens: __, ...safeUser } = user.toObject();
    return { user: safeUser, accessToken, refreshToken };
  }
}
