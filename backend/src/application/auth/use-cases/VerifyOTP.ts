import { IOTPService } from "../../../domain/auth/services/IOTPService";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IAuthService } from "../../../domain/auth/services/IAuthService";
import { AppError } from "../../../utils/AppError";
import { IUser } from "../../../domain/auth/entities/User";
import { injectable, inject } from "tsyringe";

@injectable()
export class VerifyOTP {
  constructor(
    @inject("IOTPService") private otpService: IOTPService,
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IAuthService") private authService: IAuthService
  ) {}

  async execute(email: string, otp: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    // 1. Validate OTP from Redis
    const isValid = await this.otpService.verifyOTP(email, otp);
    if (!isValid) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    // 2. Fetch User
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // 3. Mark user status as active
    user.status = "active";

    // 4. Generate JWT access and refresh tokens
    const accessToken = this.authService.generateAccessToken(user._id.toString());
    const refreshToken = this.authService.generateRefreshToken(user._id.toString());

    // 5. Save user with updated status and registered refresh token
    user.refreshTokens.push(refreshToken);
    await this.userRepository.save(user);

    return { user, accessToken, refreshToken };
  }
}
