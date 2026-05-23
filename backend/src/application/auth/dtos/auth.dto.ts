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



export interface UserOutputDTO {
  _id: string;
  name: string;
  email: string;
  fcmToken: string[];
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
      fcmToken: user.fcmToken || [],
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
