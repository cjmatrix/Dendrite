import { IEmailService } from "../../../application/common/ports/IEmailService";
import nodemailer from "nodemailer";
import { injectable } from "tsyringe";

@injectable()
export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendOTPEmail(email: string, otp: string): Promise<void> {
    const fromAddress =
      process.env.SMTP_FROM || `"Dentrites AI" <noreply@dentrites.ai>`;

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: "🔑 Your Dentrites AI Verification Code",
      text: `Your email verification code for Dentrites AI is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; background-color: #0d0f17; padding: 40px 20px; text-align: center; color: #f4f5f6; min-height: 100%;">
          <div style="max-width: 480px; margin: 0 auto; background: rgba(26, 31, 48, 0.9); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); backdrop-filter: blur(16px);">
            
            <!-- Logo Icon -->
            <div style="margin-bottom: 24px;">
              <div style="display: inline-block; width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #10b981 0%, #6366f1 100%); line-height: 64px; font-size: 32px; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);">
                🔑
              </div>
            </div>

            <!-- Heading -->
            <h2 style="font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 8px; letter-spacing: -0.5px;">Verify Your Email</h2>
            <p style="font-size: 14px; color: #9ca3af; margin-bottom: 32px; line-height: 1.5;">
              Welcome to Dentrites AI. Use the 6-digit verification code below to complete your registration.
            </p>

            <!-- OTP Code Badge -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px 24px; margin-bottom: 32px; display: inline-block;">
              <span style="font-size: 36px; font-weight: 800; color: #10b981; letter-spacing: 6px; font-family: monospace;">${otp}</span>
            </div>

            <!-- Expiration Notice -->
            <p style="font-size: 12px; color: #6b7280; margin-bottom: 24px;">
              This code will expire in <strong style="color: #ffffff;">5 minutes</strong>. If you did not request this email, you can safely ignore it.
            </p>

            <!-- Footer Divider -->
            <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 24px;" />

            <!-- Footer Text -->
            <p style="font-size: 11px; color: #4b5563; line-height: 1.5;">
              &copy; 2026 Dentrites AI. Modern cognitive spaces built securely.
            </p>
          </div>
        </div>
      `,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return;
    }

    await this.transporter.sendMail(mailOptions);
  }
}
