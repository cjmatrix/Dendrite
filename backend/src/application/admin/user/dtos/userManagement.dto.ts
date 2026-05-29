import { z } from "zod";
import { IUser } from "../../../../domain/auth/entities/User";

// --- Input Schemas ---

export const FindAllUsersInputSchema = z.object({
  page: z.string().regex(/^\d+$/, "Page must be a number").optional().or(z.literal("")),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a number")
    .optional()
    .or(z.literal("")),
  search: z.string().optional(),
  status: z.enum(["pending", "active", "banned", "suspended"]).optional().or(z.literal("")),
  sortBy: z.enum(["totalTokens", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const GetUserDetailsInputSchema = z.object({
  id: z.string().trim().min(1, "User ID is required"),
});

export type FindAllUsersInputDTO = z.infer<typeof FindAllUsersInputSchema>;
export type GetUserDetailsInputDTO = z.infer<typeof GetUserDetailsInputSchema>;

export const SuspendUserInputSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  durationInSeconds: z.number().int().positive("Duration must be a positive number"),
});

export type SuspendUserInputDTO = z.infer<typeof SuspendUserInputSchema>;

// --- Output DTOs ---

export interface AdminUserOutputDTO {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  totalTokens: number;
  createdAt: string;
}

export interface AdminUserSettingsOutputDTO {
  global: boolean;
  inline: boolean;
  diagram: boolean;
  saveHistory: boolean;
}

export interface AdminUserTokenUsageOutputDTO {
  total: number;
  mainChat: number;
  chatSummary: number;
  compressedChat: number;
  codeDescription: number;
  p5Visualization: number;
  quickChat: number;
  lastResetDate: string;
}

export interface AdminUserDetailOutputDTO {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  tier: string;
  tokensUsed: number;
  avatarUrl?: string;
  settings: AdminUserSettingsOutputDTO;
  featureUsage: {
    visuals: number;
    quickChats: number;
  };
  tokenUsage: AdminUserTokenUsageOutputDTO;
  createdAt: string;
  updatedAt: string;
}

export interface UserPaginationOutputDTO {
  users: AdminUserOutputDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}



export class UserManagementMapper {
  static toUserOutput(user: IUser): AdminUserOutputDTO {
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || "user",
      status: user.status || "active",
      totalTokens: user.token_usage?.total || 0,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  static toPaginationOutput(
    users: IUser[],
    total: number,
    page: number,
    limit: number
  ): UserPaginationOutputDTO {
    return {
      users: users.map((u) => this.toUserOutput(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static toUserDetailOutput(user: IUser): AdminUserDetailOutputDTO {
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || "user",
      status: user.status || "active",
      tier: user.tier || "free",
      tokensUsed: user.token_usage?.total || 0,
      avatarUrl: user.avatarUrl,
      settings: {
        global: !!user.settings?.global,
        inline: !!user.settings?.inline,
        diagram: !!user.settings?.diagram,
        saveHistory: !!user.settings?.saveHistory,
      },
      featureUsage: {
        visuals: user.featureUsage?.visuals || 0,
        quickChats: user.featureUsage?.quickChats || 0,
      },
      tokenUsage: {
        total: user.token_usage?.total || 0,
        mainChat: user.token_usage?.mainChat || 0,
        chatSummary: user.token_usage?.chatSummary || 0,
        compressedChat: user.token_usage?.compressedChat || 0,
        codeDescription: user.token_usage?.codeDescription || 0,
        p5Visualization: user.token_usage?.p5Visualization || 0,
        quickChat: user.token_usage?.quickChat || 0,
        lastResetDate: user.token_usage?.lastResetDate?.toISOString() || new Date().toISOString(),
      },
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
