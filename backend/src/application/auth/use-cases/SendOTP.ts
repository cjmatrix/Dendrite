import { IOTPService } from "../../../domain/auth/services/IOTPService";
import { IEmailPublisher } from "../../common/ports/IEmailPublisher";
import { AppError } from "../../../utils/AppError";
import { injectable, inject } from "tsyringe";
import { ISendOtpUseCase } from "./interfaces";

@injectable()
export class SendOTP implements ISendOtpUseCase {
  constructor(
    @inject("IOTPService") private otpService: IOTPService,
    @inject("IEmailPublisher") private emailPublisher: IEmailPublisher,
  ) {}

  async execute(email: string): Promise<{ success: boolean; message: string }> {
    const canResend = await this.otpService.canResendOTP(email);
    if (!canResend) {
      throw new AppError(
        "Please wait 60 seconds before requesting another OTP",
        429,
      );
    }

    const otp = await this.otpService.generateOTP(email);

    await this.emailPublisher.publishOTP(email, otp);

    await this.otpService.setResendCooldown(email);

    return {
      success: true,
      message: "OTP sent successfully",
    };
  }
}
