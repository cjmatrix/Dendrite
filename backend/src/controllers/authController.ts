import { Request, Response } from "express";
import { BaseController } from "./base/BaseController";
import { AppError } from "../utils/AppError";
import { injectable, inject } from "tsyringe";
import { RegisterUser } from "../application/auth/use-cases/RegisterUser";
import { LoginUser } from "../application/auth/use-cases/LoginUser";
import { RefreshTokenUser } from "../application/auth/use-cases/RefreshTokenUser";
import { LogoutUser } from "../application/auth/use-cases/LogoutUser";
import { GetMe } from "../application/auth/use-cases/GetMe";
import { UpdateFcmToken } from "../application/auth/use-cases/UpdateFcmToken";
import { SendOTP } from "../application/auth/use-cases/SendOTP";
import { VerifyOTP } from "../application/auth/use-cases/VerifyOTP";
import { container } from "tsyringe";
import { RegisterInputSchema, LoginInputSchema, UpdateFcmTokenInputSchema, SendOtpInputSchema, VerifyOtpInputSchema, AuthMapper } from "../application/auth/dtos/auth.dto";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
};

@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject(RegisterUser) private registerUser: RegisterUser,
    @inject(LoginUser) private loginUser: LoginUser,
    @inject(RefreshTokenUser) private refreshTokenUser: RefreshTokenUser,
    @inject(LogoutUser) private logoutUser: LogoutUser,
    @inject(GetMe) private getMeUseCase: GetMe,
    @inject(UpdateFcmToken) private updateFcmTokenUseCase: UpdateFcmToken,
    @inject(SendOTP) private sendOtpUseCase: SendOTP,
    @inject(VerifyOTP) private verifyOtpUseCase: VerifyOTP
  ) {
    super();
  }

 
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        throw new AppError("Passwords do not match", 400);
      }

      const validatedInput = RegisterInputSchema.parse({ name, email, password });

      const rawResult = await this.registerUser.execute(validatedInput);
      
     
      await this.sendOtpUseCase.execute(validatedInput.email);

      const outputUser = AuthMapper.toUserOutput(rawResult.user);

      this.sendSuccess(res, outputUser, 201, "Registration initiated. Verification OTP sent.");
    } catch (error) {
      this.sendError(res, error);
    }
  };

 
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
    
      const validatedInput = LoginInputSchema.parse(req.body);

      const rawResult = await this.loginUser.execute(validatedInput);

     
      const output = AuthMapper.toAuthOutput(rawResult.user, rawResult.accessToken, rawResult.refreshToken);

      res.cookie("accessToken", output.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", output.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      this.sendSuccess(res, output.user, 200, "Logged in successfully");
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

      const { accessToken, refreshToken } = await this.refreshTokenUser.execute(
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

      await this.logoutUser.execute(cookies.refreshToken);

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

      const rawUser = await this.getMeUseCase.execute(userId);

      const outputUser = AuthMapper.toUserOutput(rawUser);

      this.sendSuccess(res, outputUser);
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

      const validatedInput = UpdateFcmTokenInputSchema.parse({ userId, fcmToken });

      const result = await this.updateFcmTokenUseCase.execute(validatedInput);

      this.sendSuccess(res, result, 200, "FCM token updated successfully");
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedInput = SendOtpInputSchema.parse(req.body);
      const result = await this.sendOtpUseCase.execute(validatedInput.email);
      this.sendSuccess(res, result, 200, "OTP sent successfully");
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedInput = VerifyOtpInputSchema.parse(req.body);
      const rawResult = await this.verifyOtpUseCase.execute(validatedInput.email, validatedInput.otp);
      
      const output = AuthMapper.toAuthOutput(rawResult.user, rawResult.accessToken, rawResult.refreshToken);

      res.cookie("accessToken", output.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", output.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      this.sendSuccess(res, output.user, 200, "OTP verified and account activated successfully");
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const authController = container.resolve(AuthController);
