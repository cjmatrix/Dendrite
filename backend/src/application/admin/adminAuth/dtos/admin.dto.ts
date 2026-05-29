import { z } from "zod";
import { IUser } from "../../../../domain/auth/entities/User";

export const AdminLoginInputSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginInputDTO = z.infer<typeof AdminLoginInputSchema>;

export interface AdminUserOutputDTO {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
}

export interface AdminAuthOutputDTO {
  user: AdminUserOutputDTO;
  accessToken: string;
  refreshToken: string;
}

export class AdminAuthMapper {
  static toUserOutput(user: IUser): AdminUserOutputDTO {
    return {
      _id: user._id ? user._id.toString() : user._id || "",
      name: user.name,
      email: user.email,
      role: user.role || "user",
      status: user.status || "active",
      createdAt: user.createdAt?.toString(),
    };
  }

  static toAuthOutput(
    user: IUser,
    accessToken: string,
    refreshToken: string,
  ): AdminAuthOutputDTO {
    return {
      user: this.toUserOutput(user),
      accessToken,
      refreshToken,
    };
  }
}
