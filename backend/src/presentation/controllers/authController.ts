import { Request, Response } from "express";
import { BaseController } from "./base/BaseController";
import { AppError } from "../../utils/AppError";
import { setAuthCookies, clearAuthCookies } from "../../utils/cookieUtils";
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

import {
  AUTH_MESSAGES,
  HTTP_STATUS,
} from "../constants/authController.constants";



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

    const outputUser = await this.registerUser.execute({
      name,
      email,
      password,
    });

    await this.sendOtpUseCase.execute(email);

    this.sendSuccess(
      res,
      outputUser,
      HTTP_STATUS.CREATED,
      AUTH_MESSAGES.REGISTRATION_INITIATED,
    );
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const validatedInput = req.body;

    const output = await this.loginUser.execute(validatedInput);

    setAuthCookies(res, { accessToken: output.accessToken, refreshToken: output.refreshToken });

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

      setAuthCookies(res, { accessToken, refreshToken });

      res
        .status(HTTP_STATUS.OK)
        .json({ message: AUTH_MESSAGES.TOKEN_REFRESHED });
    } catch (err: any) {
      clearAuthCookies(res);
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

    clearAuthCookies(res);
    res.status(HTTP_STATUS.OK).json({ message: AUTH_MESSAGES.LOGGED_OUT });
  };

  public getMe = async (req: Request, res: Response): Promise<void> => {
    const userId = this.validateUserAuth(req);

    const outputUser = await this.getMeUseCase.execute(userId);

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
    const output = await this.googleLoginUseCase.execute(
      validatedInput.idToken,
    );

    setAuthCookies(res, { accessToken: output.accessToken, refreshToken: output.refreshToken });

    this.sendSuccess(
      res,
      output.user,
      HTTP_STATUS.OK,
      AUTH_MESSAGES.GOOGLE_AUTH_SUCCESS,
    );
  };
}

export const authController = container.resolve(AuthController);
