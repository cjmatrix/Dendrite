import { Request, Response } from "express";
import { container, inject, injectable } from "tsyringe";
import {
  IFindAllUserUseCase,
  IGetUserDetailsUseCase,
  ISuspendUserUseCase,
  IToggleBanUserUseCase,
  IUnsuspendUserUseCase,
} from "../../../application/admin/user/usecases/interfaces";
import { UserManagementMapper } from "../../../application/admin/user/dtos/userManagement.dto";

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
  ) {
    super();
  }

  async findAll(req: Request, res: Response) {
    const { page, limit, search, status, sortBy, sortOrder } = req.query as any;
    const parsedQuery = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search || undefined,
      status: status || undefined,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
    };

    const result = await this.findAllUser.execute(parsedQuery);

    const output = UserManagementMapper.toPaginationOutput(
      result.users,
      result.total,
      parsedQuery.page,
      parsedQuery.limit,
    );

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

    const user = await this.getUserDetails.execute(userId);

    const output = UserManagementMapper.toUserDetailOutput(user);

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
}

export const userController = container.resolve(UserController);
