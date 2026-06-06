import { Request, Response } from "express";
import { BaseController } from "../base/BaseController";
import { AppError } from "../../../utils/AppError";
import { setAuthCookies, clearAuthCookies } from "../../../utils/cookieUtils";
import { inject, injectable } from "tsyringe";
import {
  IAdminGetMeUseCase,
  IAdminLoginUseCase,
  IAdminLogoutUseCase,
  IAdminRefreshUseCase,
} from "../../../application/admin/adminAuth/usecases/interfaces";

import { container } from "tsyringe";
import {
  ADMIN_AUTH_MESSAGES,
  HTTP_STATUS,
} from "../../constants/authController.constants";



@injectable()
export class AdminAuthController extends BaseController {
  constructor(
    @inject("IAdminLoginUseCase")
    private adminLoginUseCase: IAdminLoginUseCase,
    @inject("IAdminLogoutUseCase")
    private adminLogoutUseCase: IAdminLogoutUseCase,
    @inject("IAdminGetMeUseCase")
    private adminGetMeUseCase: IAdminGetMeUseCase,
    @inject("IAdminRefreshUseCase")
    private adminRefreshUseCase: IAdminRefreshUseCase,
  ) {
    super();
  }

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedInput = req.body;
      const output = await this.adminLoginUseCase.execute(validatedInput);

      setAuthCookies(res, { accessToken: output.accessToken, refreshToken: output.refreshToken }, true);

      this.sendSuccess(
        res,
        output.user,
        HTTP_STATUS.OK,
        ADMIN_AUTH_MESSAGES.LOGGED_IN,
      );
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.adminRefreshToken;
      if (refreshToken) {
        await this.adminLogoutUseCase.execute(refreshToken);
      }

      clearAuthCookies(res, true);

      this.sendSuccess(
        res,
        null,
        HTTP_STATUS.OK,
        ADMIN_AUTH_MESSAGES.LOGGED_OUT,
      );
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.adminRefreshToken;
      if (!refreshToken) {
        throw new AppError(
          ADMIN_AUTH_MESSAGES.UNAUTHORIZED,
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await this.adminRefreshUseCase.execute(refreshToken);

      setAuthCookies(res, { accessToken, refreshToken: newRefreshToken }, true);

      res
        .status(HTTP_STATUS.OK)
        .json({ message: ADMIN_AUTH_MESSAGES.TOKEN_REFRESHED });
    } catch (error) {
      clearAuthCookies(res, true);
      this.sendError(res, error);
    }
  };

  public getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const userOutput = await this.adminGetMeUseCase.execute(userId);
      this.sendSuccess(res, userOutput);
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const adminAuthController = container.resolve(AdminAuthController);
