export interface IEmailService {
  sendOTPEmail(email: string, otp: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  healthCheck(): Promise<boolean>;
}
