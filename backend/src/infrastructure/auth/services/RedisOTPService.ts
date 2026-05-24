import { IOTPService } from "../../../domain/auth/services/IOTPService";
import { ICacheService } from "../../../application/common/ports/ICacheService";
import { injectable, inject } from "tsyringe";

@injectable()
export class RedisOTPService implements IOTPService {
  constructor(
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async generateOTP(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.cacheService.set(`otp:${email}`, otp, { EX: 300 });
    return otp;
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const storedOtp = await this.cacheService.get(`otp:${email}`);
    if (storedOtp === otp) {
      await this.cacheService.del(`otp:${email}`);
      return true;
    }
    return false;
  }

  async canResendOTP(email: string): Promise<boolean> {
    const cooldownExists = await this.cacheService.get(`otp_cooldown:${email}`);
    return !cooldownExists;
  }

  async setResendCooldown(email: string): Promise<void> {
    await this.cacheService.set(`otp_cooldown:${email}`, "1", { EX: 60 });
  }
}
