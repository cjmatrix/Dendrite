import { injectable, inject } from "tsyringe";
import { IEmailService } from "../../common/ports/IEmailService";
import { ILogger } from "../../common/ports/ILogger";

@injectable()
export class ProcessEmailJob {
  constructor(
    @inject("IEmailService") private emailService: IEmailService,
    @inject("ILogger") private logger: ILogger
  ) {}

  async execute(type: "otp" | "password-reset", data: { email: string; otp?: string; token?: string }) {
    try {
      this.logger.info(`Processing email job of type: ${type} for ${data.email}`);
      if (type === "otp") {
        if (!data.otp) {
          throw new Error("OTP is missing for OTP email job");
        }
        await this.emailService.sendOTPEmail(data.email, data.otp);
      } else if (type === "password-reset") {
        if (!data.token) {
          throw new Error("Token is missing for password reset email job");
        }
        await this.emailService.sendPasswordResetEmail(data.email, data.token);
      } else {
        throw new Error(`Unknown email job type: ${type}`);
      }
      this.logger.info(`Successfully processed email job of type: ${type} for ${data.email}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to process email job of type: ${type} for ${data.email}`, error);
      throw error;
    }
  }
}
