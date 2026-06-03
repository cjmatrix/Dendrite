import { Request, Response } from "express";
import { BaseController } from "./base/BaseController";
import { AppError } from "../../utils/AppError";
import { injectable, inject } from "tsyringe";
import {
  IGetMeUseCase,
  IGoogleLoginUseCase,
  ILoginUserUseCase,
  ILogoutUserUseCase,
  IRefreshTokenUserUseCase,
  IRegisterUserUseCase,
  ISendOtpUseCase,
  IUpdateFcmTokenUseCase,
  IVerifyOtpUseCase,
} from "../../application/auth/use-cases/interfaces";
import { container } from "tsyringe";
import { AuthMapper } from "../../application/auth/dtos/auth.dto";
import {
  AUTH_MESSAGES,
  HTTP_STATUS,
} from "../constants/authController.constants";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
};

@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject("IRegisterUserUseCase") private registerUser: IRegisterUserUseCase,
    @inject("ILoginUserUseCase") private loginUser: ILoginUserUseCase,
    @inject("IRefreshTokenUserUseCase")
    private refreshTokenUser: IRefreshTokenUserUseCase,
    @inject("ILogoutUserUseCase") private logoutUser: ILogoutUserUseCase,
    @inject("IGetMeUseCase") private getMeUseCase: IGetMeUseCase,
    @inject("IUpdateFcmTokenUseCase")
    private updateFcmTokenUseCase: IUpdateFcmTokenUseCase,
    @inject("ISendOtpUseCase") private sendOtpUseCase: ISendOtpUseCase,
    @inject("IVerifyOtpUseCase") private verifyOtpUseCase: IVerifyOtpUseCase,
    @inject("IGoogleLoginUseCase")
    private googleLoginUseCase: IGoogleLoginUseCase,
  ) {
    super();
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;

    const rawResult = await this.registerUser.execute({
      name,
      email,
      password,
    });

    await this.sendOtpUseCase.execute(email);

    const outputUser = AuthMapper.toUserOutput(rawResult.user);

    this.sendSuccess(
      res,
      outputUser,
      HTTP_STATUS.CREATED,
      AUTH_MESSAGES.REGISTRATION_INITIATED,
    );
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const validatedInput = req.body;

    const rawResult = await this.loginUser.execute(validatedInput);

    const output = AuthMapper.toAuthOutput(
      rawResult.user,
      rawResult.accessToken,
      rawResult.refreshToken,
    );

    res.cookie("accessToken", output.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", output.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    this.sendSuccess(res, output.user, HTTP_STATUS.OK, AUTH_MESSAGES.LOGGED_IN);
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const cookies = req.cookies;
      if (!cookies?.refreshToken) {
        throw new AppError(
          AUTH_MESSAGES.UNAUTHORIZED,
          HTTP_STATUS.UNAUTHORIZED,
        );
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

      res
        .status(HTTP_STATUS.OK)
        .json({ message: AUTH_MESSAGES.TOKEN_REFRESHED });
    } catch (err: any) {
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      this.sendError(res, err);
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
      res.sendStatus(HTTP_STATUS.NO_CONTENT);
      return;
    }

    await this.logoutUser.execute(cookies.refreshToken);

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.status(HTTP_STATUS.OK).json({ message: AUTH_MESSAGES.LOGGED_OUT });
  };

  public getMe = async (req: Request, res: Response): Promise<void> => {
    const userId = this.validateUserAuth(req);

    const rawUser = await this.getMeUseCase.execute(userId);

    const outputUser = AuthMapper.toUserOutput(rawUser);

    this.sendSuccess(res, outputUser);
  };

  public updateFcmToken = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const userId = this.validateUserAuth(req);
    const { fcmToken } = req.body;

    const validatedInput = { userId, fcmToken };

    const result = await this.updateFcmTokenUseCase.execute(validatedInput);

    this.sendSuccess(
      res,
      result,
      HTTP_STATUS.OK,
      AUTH_MESSAGES.FCM_TOKEN_UPDATED,
    );
  };

  public sendOtp = async (req: Request, res: Response): Promise<void> => {
    const validatedInput = req.body;
    const result = await this.sendOtpUseCase.execute(validatedInput.email);
    this.sendSuccess(res, result, HTTP_STATUS.OK, AUTH_MESSAGES.OTP_SENT);
  };

  public verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const validatedInput = req.body;
    const result = await this.verifyOtpUseCase.execute(
      validatedInput.email,
      validatedInput.otp,
    );

    this.sendSuccess(res, result, HTTP_STATUS.OK, AUTH_MESSAGES.OTP_VERIFIED);
  };

  public googleLogin = async (req: Request, res: Response): Promise<void> => {
    const validatedInput = req.body;
    const rawResult = await this.googleLoginUseCase.execute(
      validatedInput.idToken,
    );

    const output = AuthMapper.toAuthOutput(
      rawResult.user,
      rawResult.accessToken,
      rawResult.refreshToken,
    );

    res.cookie("accessToken", output.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", output.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    this.sendSuccess(
      res,
      output.user,
      HTTP_STATUS.OK,
      AUTH_MESSAGES.GOOGLE_AUTH_SUCCESS,
    );
  };
}

export const authController = container.resolve(AuthController);
