import { z } from "zod";
import { IUser } from "../../../domain/auth/entities/User";



export const RegisterInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInputDTO = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInputDTO = z.infer<typeof LoginInputSchema>;

export const UpdateFcmTokenInputSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  fcmToken: z.string().trim().min(1, "FCM Token is required"),
});

export type UpdateFcmTokenInputDTO = z.infer<typeof UpdateFcmTokenInputSchema>;

export const SendOtpInputSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
});
export type SendOtpInputDTO = z.infer<typeof SendOtpInputSchema>;

export const VerifyOtpInputSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  otp: z.string().trim().length(6, "OTP must be exactly 6 digits"),
});
export type VerifyOtpInputDTO = z.infer<typeof VerifyOtpInputSchema>;

export const GoogleLoginInputSchema = z.object({
  idToken: z.string().min(1, "Google ID Token is required"),
});
export type GoogleLoginInputDTO = z.infer<typeof GoogleLoginInputSchema>;

export const UpdateByokKeysInputSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  provider: z.enum(["gemini"]),
  keys: z.array(z.string().min(1, "API Key cannot be empty")).min(1, "At least 1 API key is required").max(6, "Maximum 6 API keys allowed"),
});
export type UpdateByokKeysInputDTO = z.infer<typeof UpdateByokKeysInputSchema>;



export interface UserOutputDTO {
  _id: string;
  name: string;
  email: string;
  status:string;
  fcmToken: string[];
  tier: string;
  byokKeysCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthOutputDTO {
  user: UserOutputDTO;
  accessToken: string;
  refreshToken: string;
}

export class AuthMapper {
  static toUserOutput(user:IUser): UserOutputDTO {
    return {
      _id: user._id ? user._id.toString() : (user._id || ""),
      name: user.name,
      email: user.email,
      status:user.status,
      fcmToken: user.fcmToken || [],
      tier: user.tier || "free",
      byokKeysCount: user.byok_keys?.find((k) => k.provider === "gemini")?.encryptedKeys?.length || 0,
      createdAt: user.createdAt?.toString(),
      updatedAt: user.updatedAt?.toString(),
    };
  }

  static toAuthOutput(user: any, accessToken: string, refreshToken: string): AuthOutputDTO {
    return {
      user: this.toUserOutput(user),
      accessToken,
      refreshToken,
    };
  }
}
