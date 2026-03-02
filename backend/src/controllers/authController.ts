import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AppError } from '../utils/AppError';

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
};

export const AuthController = {
  async register(req: Request, res: Response) {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      throw new AppError('All fields are required', 400);
    }

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    const { user, accessToken, refreshToken } = await AuthService.register({ name, email, password });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

    res.status(201).json({ user, message: 'User registered successfully' });
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const { user, accessToken, refreshToken } = await AuthService.login({ email, password });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(200).json({ user, message: 'Logged in successfully' });
  },

  async refresh(req: Request, res: Response) {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
      throw new AppError('Unauthorized', 401);
    }

    try {
      const { accessToken, refreshToken } = await AuthService.refresh(cookies.refreshToken);

      res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.status(200).json({ message: 'Token refreshed' });
    } catch(err: any) {
      // Clear cookies if refresh fails
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);
      throw err; // Let the global error handler catch it
    }
  },

  async logout(req: Request, res: Response) {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
        return res.sendStatus(204); // No content
    }

    await AuthService.logout(cookies.refreshToken);
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(200).json({ message: 'Logged out successfully' });
  },

  async getMe(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    
    const user = await AuthService.getMe(req.user._id.toString());
    res.status(200).json({ user });
  }
};
