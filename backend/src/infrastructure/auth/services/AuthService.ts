import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IAuthService } from "../../../domain/auth/services/IAuthService";
import { injectable } from "tsyringe";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_super_secure';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_super_secure';

@injectable()
export class AuthService implements IAuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  verifyAccessToken(token: string): Record<string, unknown> {
    return jwt.verify(token, JWT_ACCESS_SECRET) as Record<string, unknown>;
  }

  verifyRefreshToken(token: string): Record<string, unknown> {
    return jwt.verify(token, JWT_REFRESH_SECRET) as Record<string, unknown>;
  }
}
