import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils';
import { User } from '../../model/User';

const isProduction = process.env.NODE_ENV === 'production';

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
};

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      const user = await AuthService.registerUser({ name, email, password });

      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      await AuthService.addRefreshToken(user._id.toString(), refreshToken);

      res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
      res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

      res.status(201).json({ user, message: 'User registered successfully' });
    } catch (error: any) {
      if (error.message === 'User already exists') {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await AuthService.loginUser(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
         return res.status(401).json({ message: 'Invalid credentials' });
      }

      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      await AuthService.addRefreshToken(user._id.toString(), refreshToken);

      res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.status(200).json({ user, message: 'Logged in successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  async refresh(req: Request, res: Response) {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const refreshToken = cookies.refreshToken;

    try {
      const decoded: any = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);

      // Token Rotation: Check if token exists in DB, if not, it means compromised
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        if (user) {
          // Compromised token detected, clear all tokens to re-login user
          await AuthService.clearAllTokens(user._id.toString());
        }
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);
        return res.status(403).json({ message: 'Forbidden: Compromised Token' });
      }

      const newAccessToken = generateAccessToken(user._id.toString());
      const newRefreshToken = generateRefreshToken(user._id.toString());

      // Replace old with new token
      await AuthService.replaceRefreshToken(user._id.toString(), refreshToken, newRefreshToken);

      res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.status(200).json({ message: 'Token refreshed' });
    } catch (error: any) {
       res.clearCookie('accessToken', cookieOptions);
       res.clearCookie('refreshToken', cookieOptions);
       return res.status(403).json({ message: 'Forbidden' });
    }
  },

  async logout(req: Request, res: Response) {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
        return res.sendStatus(204); // No content
    }

    const refreshToken = cookies.refreshToken;

    try {
      const decoded: any = verifyRefreshToken(refreshToken);
      if (decoded && decoded.userId) {
          await AuthService.removeRefreshToken(decoded.userId, refreshToken);
      }
    } catch(err) {
       // Ignore verification error on logout
    }

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(200).json({ message: 'Logged out successfully' });
  },

  async getMe(req: Request, res: Response) {
     if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
     }
     const user = await User.findById(req.user.userId);
     if (!user) {
        return res.status(404).json({ message: 'User not found' });
     }
     res.status(200).json({ user });
  }
};
