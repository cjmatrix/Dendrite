import { Request, Response } from "express";
import { container, inject, injectable } from "tsyringe";
import {
  IFindAllUserUseCase,
  IGetUserDetailsUseCase,
  ISuspendUserUseCase,
  IToggleBanUserUseCase,
  IUnsuspendUserUseCase,
  IGetUserRateLimitUsageUseCase,
  IResetUserRateLimitsUseCase,
} from "../../../application/admin/user/usecases/interfaces";


import { BaseController } from "../base/BaseController";
import {
  ADMIN_USER_MESSAGES,
  HTTP_STATUS,
} from "../../constants/authController.constants";

@injectable()
class UserController extends BaseController {
  constructor(
    @inject("IFindAllUserUseCase") private findAllUser: IFindAllUserUseCase,
    @inject("IGetUserDetailsUseCase")
    private getUserDetails: IGetUserDetailsUseCase,
    @inject("ISuspendUserUseCase") private suspendUser: ISuspendUserUseCase,
    @inject("IUnsuspendUserUseCase")
    private unsuspendUser: IUnsuspendUserUseCase,
    @inject("IToggleBanUserUseCase")
    private toggleBanUser: IToggleBanUserUseCase,
    @inject("IGetUserRateLimitUsageUseCase")
    private getUserRateLimitUsage: IGetUserRateLimitUsageUseCase,
    @inject("IResetUserRateLimitsUseCase")
    private resetUserRateLimits: IResetUserRateLimitsUseCase,
  ) {
    super();
  }

  async findAll(req: Request, res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { page, limit, search, status, sortBy, sortOrder } = req.query as any;
    const parsedQuery = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search || undefined,
      status: status || undefined,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
    };

    const output = await this.findAllUser.execute(parsedQuery);

    this.sendSuccess(
      res,
      output,
      HTTP_STATUS.OK,
      ADMIN_USER_MESSAGES.USERS_RETRIEVED,
    );
  }

  async findById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = id as string;

    const output = await this.getUserDetails.execute(userId);

    this.sendSuccess(
      res,
      output,
      HTTP_STATUS.OK,
      ADMIN_USER_MESSAGES.USER_DETAILS_RETRIEVED,
    );
  }

  async suspend(req: Request, res: Response) {
    const { id } = req.params;
    const userId = id as string;
    const { durationInSeconds } = req.body;

    const validatedData = {
      userId,
      durationInSeconds: Number(durationInSeconds),
    };

    await this.suspendUser.execute(
      validatedData.userId,
      validatedData.durationInSeconds,
    );

    this.sendSuccess(
      res,
      null,
      HTTP_STATUS.OK,
      ADMIN_USER_MESSAGES.USER_SUSPENDED,
    );
  }

  async unsuspend(req: Request, res: Response) {
    const { id } = req.params;
    const userId = id as string;

    await this.unsuspendUser.execute(userId);

    this.sendSuccess(
      res,
      null,
      HTTP_STATUS.OK,
      ADMIN_USER_MESSAGES.USER_UNSUSPENDED,
    );
  }

  async toggleBan(req: Request, res: Response) {
    const { id } = req.params;
    const userId = id as string;

    const newStatus = await this.toggleBanUser.execute(userId);

    this.sendSuccess(
      res,
      { status: newStatus },
      HTTP_STATUS.OK,
      ADMIN_USER_MESSAGES.USER_TOGGLE_BAN(
        newStatus === "banned" ? "banned" : "unbanned",
      ),
    );
  }

  async getUsage(req: Request, res: Response) {
    const { id } = req.params;
    const userId = id as string;

    const output = await this.getUserRateLimitUsage.execute(userId);

    this.sendSuccess(
      res,
      output,
      HTTP_STATUS.OK,
      "User rate limit usage retrieved successfully"
    );
  }

  async resetUsage(req: Request, res: Response) {
    const { id } = req.params;
    const userId = id as string;

    await this.resetUserRateLimits.execute(userId);

    this.sendSuccess(
      res,
      null,
      HTTP_STATUS.OK,
      "User rate limit usage reset successfully"
    );
  }
}

export const userController = container.resolve(UserController);
