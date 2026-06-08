import {
  LoginInputDTO,
  RegisterInputDTO,
  UpdateFcmTokenInputDTO,
  UserOutputDTO,
  AuthOutputDTO,
} from "../dtos/auth.dto";

export interface IRegisterUserUseCase {
  execute(userData: RegisterInputDTO): Promise<UserOutputDTO>;
}

export interface ILoginUserUseCase {
  execute(userData: LoginInputDTO): Promise<AuthOutputDTO>;
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
  execute(userId: string): Promise<UserOutputDTO>;
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
  execute(
    idToken: string,
  ): Promise<AuthOutputDTO>;
}

export interface IUpdateByokKeysUseCase {
  execute(input: import("../dtos/auth.dto").UpdateByokKeysInputDTO): Promise<{ success: boolean; message: string }>;
}

