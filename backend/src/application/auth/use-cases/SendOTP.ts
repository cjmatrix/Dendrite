import { IOTPService } from "../../../domain/auth/services/IOTPService";
import { IEmailService } from "../../../domain/shared/services/IEmailService";
import { AppError } from "../../../utils/AppError";
import { injectable, inject } from "tsyringe";

@injectable()
export class SendOTP {
  constructor(
    @inject("IOTPService") private otpService: IOTPService,
    @inject("IEmailService") private emailService: IEmailService
  ) {}

  async execute(email: string): Promise<{ success: boolean; message: string }> {
    const canResend = await this.otpService.canResendOTP(email);
    if (!canResend) {
      throw new AppError("Please wait 60 seconds before requesting another OTP", 429);
    }

    const otp = await this.otpService.generateOTP(email);
    
    
    await this.emailService.sendOTPEmail(email, otp);
    
    await this.otpService.setResendCooldown(email);

    return {
      success: true,
      message: "OTP sent successfully",
    };
  }
}
