import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils';
import { UserPayload } from '../types';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No Token Provided' });
  }

  try {
    const decoded = verifyAccessToken(token) as UserPayload;
    req.user = decoded; // add user to request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid Token' });
  }
};
