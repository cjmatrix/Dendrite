import { IOTPService } from "../../../domain/auth/services/IOTPService";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { AppError } from "../../../utils/AppError";
import { injectable, inject } from "tsyringe";

@injectable()
export class VerifyOTP {
  constructor(
    @inject("IOTPService") private otpService: IOTPService,
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}

  async execute(email: string, otp: string): Promise<{ success: boolean; message: string }> {

    const isValid = await this.otpService.verifyOTP(email, otp);
    if (!isValid) {
      throw new AppError("Invalid or expired OTP", 400);
    }


    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found", 404);
    }

   
    user.status = "active";

   
    await this.userRepository.save(user);

    return { 
      success: true, 
      message: "Account activated successfully. Please log in." 
    };
  }
}
