export interface IEmailService {
  sendOTPEmail(email: string, otp: string): Promise<void>;
}
