import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils';
import { IUserRepository } from '../domain/auth/repositories/IUserRepository';
import { MongoUserRepository } from '../infrastructure/auth/repositories/MongoUserRepository';

const userRepository: IUserRepository = new MongoUserRepository();

export const userProtect = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No Token Provided' });
  }

  try {
    const decoded = verifyAccessToken(token) as { userId: string };

    const user = await userRepository.findByIdSafe(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid Token' });
  }
};
