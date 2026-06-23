import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { ICacheService } from "../../common/ports/ICacheService";
import { AppError } from "../../../utils/AppError";
import { injectable, inject } from "tsyringe";
import { IResetPasswordUseCase } from "./interfaces";
import { ResetPasswordInputDTO } from "../dtos/auth.dto";
import crypto from "crypto";

@injectable()
export class ResetPassword implements IResetPasswordUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("ICacheService") private cacheService: ICacheService,
  ) {}

  async execute(input: ResetPasswordInputDTO): Promise<{ success: boolean; message: string }> {
    const { email, token, password } = input;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid or expired password reset token", 400);
    }

    
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const cachedEmail = await this.cacheService.get(`forgot_password:${hashedToken}`);

    
    if (!cachedEmail || cachedEmail.toLowerCase() !== email.toLowerCase()) {
      throw new AppError("Invalid or expired password reset token", 400);
    }

   
    user.password = password;

    await this.userRepository.save(user);

    
    await this.cacheService.del(`forgot_password:${hashedToken}`);

    return {
      success: true,
      message: "Password reset successful. You can now login with your new password.",
    };
  }
}
