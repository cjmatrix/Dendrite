export interface IOTPService {
  generateOTP(email: string): Promise<string>;
  verifyOTP(email: string, otp: string): Promise<boolean>;
  canResendOTP(email: string): Promise<boolean>;
  setResendCooldown(email: string): Promise<void>;
}
