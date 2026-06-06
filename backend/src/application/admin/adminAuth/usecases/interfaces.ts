import { AdminLoginInputDTO, AdminUserOutputDTO, AdminAuthOutputDTO } from "../dtos/admin.dto";

export interface IAdminLoginUseCase {
  execute(input: AdminLoginInputDTO): Promise<AdminAuthOutputDTO>;
}

export interface IAdminLogoutUseCase {
  execute(refreshToken: string): Promise<void>;
}

export interface IAdminGetMeUseCase {
  execute(adminId: string): Promise<AdminUserOutputDTO>;
}

export interface IAdminRefreshUseCase {
  execute(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
}

