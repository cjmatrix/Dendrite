import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IEmailService } from "../../common/ports/IEmailService";
import { ICacheService } from "../../common/ports/ICacheService";
import { injectable, inject } from "tsyringe";
import { IForgotPasswordUseCase } from "./interfaces";
import crypto from "crypto";

@injectable()
export class ForgotPassword implements IForgotPasswordUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IEmailService") private emailService: IEmailService,
    @inject("ICacheService") private cacheService: ICacheService,
  ) {}

  async execute(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return {
        success: true,
        message: "If that email address exists, we have sent a reset link to it.",
      };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    
    await this.cacheService.set(`forgot_password:${hashedToken}`, user.email, { EX: 600 });

  
    await this.emailService.sendPasswordResetEmail(user.email, token);

    return {
      success: true,
      message: "If that email address exists, we have sent a reset link to it.",
    };
  }
}
