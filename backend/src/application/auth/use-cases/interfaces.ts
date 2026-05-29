import { IUser } from "../../../domain/auth/entities/User";
import {
  LoginInputDTO,
  RegisterInputDTO,
  UpdateFcmTokenInputDTO,
} from "../dtos/auth.dto";

export interface IRegisterUserUseCase {
  execute(userData: RegisterInputDTO): Promise<{ user: IUser }>;
}

export interface ILoginUserUseCase {
  execute(userData: LoginInputDTO): Promise<{
    user: IUser;
    accessToken: string;
    refreshToken: string;
  }>;
}

export interface IRefreshTokenUserUseCase {
  execute(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
}

export interface ILogoutUserUseCase {
  execute(refreshToken: string): Promise<void>;
}

export interface IGetMeUseCase {
  execute(userId: string): Promise<IUser>;
}

export interface IUpdateFcmTokenUseCase {
  execute(
    data: UpdateFcmTokenInputDTO,
  ): Promise<{ success: boolean; message: string }>;
}

export interface ISendOtpUseCase {
  execute(email: string): Promise<{ success: boolean; message: string }>;
}

export interface IVerifyOtpUseCase {
  execute(
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }>;
}

export interface IGoogleLoginUseCase {
  execute(idToken: string): Promise<{
    user: IUser;
    accessToken: string;
    refreshToken: string;
  }>;
}
