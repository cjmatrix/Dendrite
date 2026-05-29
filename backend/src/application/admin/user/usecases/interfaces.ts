import { IUser } from "../../../../domain/auth/entities/User";

export interface IFindAllUserUseCase {
  execute(query: any): Promise<{ users: IUser[]; total: number }>;
}

export interface IGetUserDetailsUseCase {
  execute(userId: string): Promise<IUser>;
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
