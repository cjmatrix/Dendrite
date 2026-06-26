export interface IAuthService {
  hashPassword(password: string): Promise<string>;
  comparePassword(plain: string, hashed: string): Promise<boolean>;
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string): string;
  verifyAccessToken(token: string): Record<string, unknown>;
  verifyRefreshToken(token: string): Record<string, unknown>;
}
