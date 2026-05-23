import {IUser} from '../entities/User'

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
  findByIdSafe(id: string): Promise<IUser | null>;
  create(userData: any): Promise<IUser>;
  save(user: IUser, session?: any): Promise<IUser>;
  updateRefreshTokens(userId: string, tokens: string[]): Promise<void>;
  addRefreshToken(userId: string, token: string): Promise<void>;
  replaceRefreshToken(
    userId: string,
    oldToken: string,
    newToken: string,
  ): Promise<void>;
  removeRefreshToken(userId: string, token: string): Promise<void>;
  clearRefreshTokens(userId: string): Promise<void>;
}
