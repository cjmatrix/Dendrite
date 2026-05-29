import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IAuthService } from "../../../domain/auth/services/IAuthService";
import { ICacheService } from "../../../application/common/ports/ICacheService";
import { AppError } from "../../../utils/AppError";
import { LoginInputDTO } from "../dtos/auth.dto";
import { IUser } from "../../../domain/auth/entities/User";
import { injectable, inject } from "tsyringe";
import { ILoginUserUseCase } from "./interfaces";

@injectable()
export class LoginUser implements ILoginUserUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IAuthService") private authService: IAuthService,
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async execute(userData: LoginInputDTO): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const { email, password } = userData;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

     if(user.status==="suspended"){
         const isSuspended = await this.cacheService.exists(`suspend:${user._id}`);
        if (isSuspended) {
        throw new AppError("Forbidden: Your account is currently suspended",400)
        }
     
        await this.userRepository.findByIdAndUpdate(user._id,{status:"active"})
        user.status = "active"; 
      }

     if (user.status == "banned") {
      throw new AppError("Your account has been banned", 403);
    } 

    if (user.status !== "active") {
      throw new AppError("Please verify your email before logging in", 403);
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
