import { IUser } from "../../../../domain/auth/entities/User";
import { AdminLoginInputDTO } from "../dtos/admin.dto";

export interface IAdminLoginUseCase {
  execute(input: AdminLoginInputDTO): Promise<{
    user: IUser;
    accessToken: string;
    refreshToken: string;
  }>;
}

export interface IAdminLogoutUseCase {
  execute(refreshToken: string): Promise<void>;
}

export interface IAdminGetMeUseCase {
  execute(adminId: string): Promise<IUser>;
}

export interface IAdminRefreshUseCase {
  execute(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
}
