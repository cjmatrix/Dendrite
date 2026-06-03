import { Request, Response } from "express";
import { BaseController } from "../base/BaseController";
import { AppError } from "../../../utils/AppError";
import { inject, injectable } from "tsyringe";
import {
  IAdminGetMeUseCase,
  IAdminLoginUseCase,
  IAdminLogoutUseCase,
  IAdminRefreshUseCase,
} from "../../../application/admin/adminAuth/usecases/interfaces";
import { AdminAuthMapper } from "../../../application/admin/adminAuth/dtos/admin.dto";
import { container } from "tsyringe";
import {
  ADMIN_AUTH_MESSAGES,
  HTTP_STATUS,
} from "../../constants/authController.constants";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
};

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
      const rawResult = await this.adminLoginUseCase.execute(validatedInput);

      const output = AdminAuthMapper.toAuthOutput(
        rawResult.user,
        rawResult.accessToken,
        rawResult.refreshToken,
      );

      res.cookie("adminAccessToken", output.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("adminRefreshToken", output.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

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

      res.clearCookie("adminAccessToken", cookieOptions);
      res.clearCookie("adminRefreshToken", cookieOptions);

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

      res.cookie("adminAccessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("adminRefreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res
        .status(HTTP_STATUS.OK)
        .json({ message: ADMIN_AUTH_MESSAGES.TOKEN_REFRESHED });
    } catch (error) {
      res.clearCookie("adminAccessToken", cookieOptions);
      res.clearCookie("adminRefreshToken", cookieOptions);
      this.sendError(res, error);
    }
  };

  public getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const user = await this.adminGetMeUseCase.execute(userId);
      this.sendSuccess(res, AdminAuthMapper.toUserOutput(user));
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const adminAuthController = container.resolve(AdminAuthController);
