import { UserPaginationOutputDTO, AdminUserDetailOutputDTO } from "../dtos/userManagement.dto";

export interface IFindAllUserUseCase {
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

