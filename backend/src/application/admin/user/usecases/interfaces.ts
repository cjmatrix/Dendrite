import { UserPaginationOutputDTO, AdminUserDetailOutputDTO } from "../dtos/userManagement.dto";

export interface IFindAllUserUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(query: any): Promise<UserPaginationOutputDTO>;
}

export interface IGetUserDetailsUseCase {
  execute(userId: string): Promise<AdminUserDetailOutputDTO>;
}

export interface ISuspendUserUseCase {
  execute(userId: string, durationInSeconds: number): Promise<void>;
}

export interface IUnsuspendUserUseCase {
  execute(userId: string): Promise<void>;
}

export interface IToggleBanUserUseCase {
  execute(userId: string): Promise<string>;
}

export interface IGetUserRateLimitUsageUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(targetUserId: string): Promise<any>;
}

export interface IResetUserRateLimitsUseCase {
  execute(targetUserId: string): Promise<void>;
}

