import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IAuthService } from "../../../domain/auth/services/IAuthService";
import { AppError } from "../../../utils/AppError";
import { LoginInputDTO } from "../dtos/auth.dto";
import { IUser } from "../../../domain/auth/entities/User";
import { injectable, inject } from "tsyringe";

@injectable()
export class LoginUser {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IAuthService") private authService: IAuthService
  ) {}

  async execute(userData: LoginInputDTO): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const { email, password } = userData;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isMatch = await this.authService.comparePassword(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    const accessToken = this.authService.generateAccessToken(user._id.toString());
    const refreshToken = this.authService.generateRefreshToken(user._id.toString());

    await this.userRepository.addRefreshToken(
      user._id.toString(),
      refreshToken,
    );

    return { user, accessToken, refreshToken };
  }
}
