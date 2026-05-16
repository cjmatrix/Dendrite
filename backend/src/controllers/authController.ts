import { Request, Response } from "express";
import { BaseController } from "./base/BaseController";
import { DIContainer } from "./container/DIContainer";
import { AppError } from "../utils/AppError";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
};

export class AuthController extends BaseController {
  constructor() {
    super();
  }

 
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (!name || !email || !password || !confirmPassword) {
        throw new AppError("All fields are required", 400);
      }

      if (password !== confirmPassword) {
        throw new AppError("Passwords do not match", 400);
      }

      const registerUser = DIContainer.getRegisterUserUseCase();
      const { user, accessToken, refreshToken } = await registerUser.execute({
        name,
        email,
        password,
      });

      res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      this.sendSuccess(res, user, 201, "User registered successfully");
    } catch (error) {
      this.sendError(res, error);
    }
  };

 
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError("Email and password are required", 400);
      }

      const loginUser = DIContainer.getLoginUserUseCase();
      const { user, accessToken, refreshToken } = await loginUser.execute({
        email,
        password,
      });

      res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      this.sendSuccess(res, user, 200, "Logged in successfully");
    } catch (error) {
      this.sendError(res, error);
    }
  };

  
  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const cookies = req.cookies;
      if (!cookies?.refreshToken) {
        throw new AppError("Unauthorized", 401);
      }

      const refreshTokenUser = DIContainer.getRefreshTokenUserUseCase();
      const { accessToken, refreshToken } = await refreshTokenUser.execute(
        cookies.refreshToken,
      );

      res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ message: "Token refreshed" });
    } catch (err: any) {
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      this.sendError(res, err);
    }
  };

 
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const cookies = req.cookies;
      if (!cookies?.refreshToken) {
        res.sendStatus(204);
        return;
      }

      const logoutUser = DIContainer.getLogoutUserUseCase();
      await logoutUser.execute(cookies.refreshToken);

      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      this.sendError(res, error);
    }
  };


  public getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const getMeUseCase = DIContainer.getGetMeUseCase();
      const user = await getMeUseCase.execute(userId);

      this.sendSuccess(res, user);
    } catch (error) {
      this.sendError(res, error);
    }
  };


  public updateFcmToken = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { fcmToken } = req.body;

      if (!fcmToken) {
        throw new AppError("FCM token is required", 400);
      }

      const updateFcmTokenUseCase = DIContainer.getUpdateFcmTokenUseCase();
      const result = await updateFcmTokenUseCase.execute(userId, fcmToken);

      this.sendSuccess(res, result, 200, "FCM token updated successfully");
    } catch (error) {
      this.sendError(res, error);
    }
  };
}


export const authController = new AuthController();
