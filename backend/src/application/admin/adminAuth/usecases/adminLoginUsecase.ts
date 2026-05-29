import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { IAuthService } from "../../../../domain/auth/services/IAuthService";
import { ICacheService } from "../../../../application/common/ports/ICacheService";
import { AppError } from "../../../../utils/AppError";
import { AdminLoginInputDTO } from "../dtos/admin.dto";
import { IUser } from "../../../../domain/auth/entities/User";

@injectable()
export class AdminLoginUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IAuthService") private authService: IAuthService,
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async execute(input: AdminLoginInputDTO): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const { email, password } = input;

  
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

   
    if (user.role !== "admin") {
      throw new AppError("Access denied: Admin credentials required", 403);
    }

    
    if (user.status !== "active") {
      throw new AppError("Account is inactive", 403);
    }

    
    const isMatch = await this.authService.comparePassword(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

   
    const accessToken = this.authService.generateAccessToken(user._id.toString());
    const refreshToken = this.authService.generateRefreshToken(user._id.toString());

    
    await this.cacheService.set(`refresh_token:${refreshToken}`, user._id.toString(), { EX: 604800 });

    return { user, accessToken, refreshToken };
  }
}