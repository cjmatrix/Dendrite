import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import { MongoUserRepository } from '../infrastructure/auth/repositories/MongoUserRepository';
import { RegisterUser } from '../application/auth/use-cases/RegisterUser';
import { LoginUser } from '../application/auth/use-cases/LoginUser';
import { RefreshTokenUser } from '../application/auth/use-cases/RefreshTokenUser';
import { LogoutUser } from '../application/auth/use-cases/LogoutUser';
import { GetMe } from '../application/auth/use-cases/GetMe';

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
};

const userRepository = new MongoUserRepository();

export const AuthController = {
  async register(req: Request, res: Response) {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      throw new AppError('All fields are required', 400);
    }

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    const registerUser = new RegisterUser(userRepository);
    const { user, accessToken, refreshToken } = await registerUser.execute({ name, email, password });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

    res.status(201).json({ user, message: 'User registered successfully' });
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const loginUser = new LoginUser(userRepository);
    const { user, accessToken, refreshToken } = await loginUser.execute({ email, password });

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
      const refreshTokenUser = new RefreshTokenUser(userRepository);
      const { accessToken, refreshToken } = await refreshTokenUser.execute(cookies.refreshToken);

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

    const logoutUser = new LogoutUser(userRepository);
    await logoutUser.execute(cookies.refreshToken);
    
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(200).json({ message: 'Logged out successfully' });
  },

  async getMe(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    
    const getMeUseCase = new GetMe(userRepository);
    const user = await getMeUseCase.execute(req.user._id.toString());
    res.status(200).json({ user });
  },

  async saveFCMToken(req: Request, res: Response) {
    if (!req.user) throw new AppError('Unauthorized', 401);

    const { fcmToken } = req.body;
    if (!fcmToken) throw new AppError('fcmToken is required', 400);

    const user = await userRepository.findById(req.user._id.toString());
    if (!user) throw new AppError('User not found', 404);

    if (!user.fcmToken) user.fcmToken = [];
    if (!user.fcmToken.includes(fcmToken)) {
      user.fcmToken.push(fcmToken);
      await userRepository.save(user);
    }

    res.status(200).json({ success: true, message: 'FCM token saved' });
  }
};

