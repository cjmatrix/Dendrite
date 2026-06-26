export interface IEmailPublisher {
  publishOTP(email: string, otp: string): Promise<string | undefined>;
  publishPasswordReset(email: string, token: string): Promise<string | undefined>;
}
