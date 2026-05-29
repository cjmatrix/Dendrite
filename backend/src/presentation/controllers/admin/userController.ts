import { Request, Response } from "express";
import { container, inject, injectable } from "tsyringe";
import { FindAllUser } from "../../../application/admin/user/usecases/findAllUser";
import { GetUserDetails } from "../../../application/admin/user/usecases/GetUserDetails";
import { SuspendUser } from "../../../application/admin/user/usecases/suspendUser";
import { UnsuspendUser } from "../../../application/admin/user/usecases/unsuspendUser";
import { ToggleBanUser } from "../../../application/admin/user/usecases/toggleBanUser";
import { UserManagementMapper } from "../../../application/admin/user/dtos/userManagement.dto";

import { BaseController } from "../base/BaseController";
import {
  ADMIN_USER_MESSAGES,
  HTTP_STATUS,
} from "../constants/authController.constants";

@injectable()
class UserController extends BaseController{


    constructor (
        @inject(FindAllUser) private findAllUser:FindAllUser,
        @inject(GetUserDetails) private getUserDetails:GetUserDetails,
        @inject(SuspendUser) private suspendUser:SuspendUser,
        @inject(UnsuspendUser) private unsuspendUser:UnsuspendUser,
        @inject(ToggleBanUser) private toggleBanUser:ToggleBanUser
    ){
        super();
    };

    async findAll(req:Request,res:Response){
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
         parsedQuery.limit
       );

      this.sendSuccess(res, output, HTTP_STATUS.OK, ADMIN_USER_MESSAGES.USERS_RETRIEVED);
        
    }

    async findById(req:Request,res:Response){
      const { id } = req.params;
      const userId = id as string;

      const user = await this.getUserDetails.execute(userId);

        const output = UserManagementMapper.toUserDetailOutput(user);

        this.sendSuccess(res, output, HTTP_STATUS.OK, ADMIN_USER_MESSAGES.USER_DETAILS_RETRIEVED);
    }

    async suspend(req: Request, res: Response) {
      const { id } = req.params;
      const userId = id as string;
      const { durationInSeconds } = req.body;

      const validatedData = {
        userId,
        durationInSeconds: Number(durationInSeconds),
      };

      await this.suspendUser.execute(validatedData.userId, validatedData.durationInSeconds);

      this.sendSuccess(res, null, HTTP_STATUS.OK, ADMIN_USER_MESSAGES.USER_SUSPENDED);
    }

    async unsuspend(req: Request, res: Response) {
      const { id } = req.params;
      const userId = id as string;

      await this.unsuspendUser.execute(userId);

      this.sendSuccess(res, null, HTTP_STATUS.OK, ADMIN_USER_MESSAGES.USER_UNSUSPENDED);
    }

    async toggleBan(req: Request, res: Response) {
      const { id } = req.params;
      const userId = id as string;

      const newStatus = await this.toggleBanUser.execute(userId);

      this.sendSuccess(
        res,
        { status: newStatus },
        HTTP_STATUS.OK,
        ADMIN_USER_MESSAGES.USER_TOGGLE_BAN(newStatus === "banned" ? "banned" : "unbanned"),
      );
    }
}

export const userController=container.resolve(UserController)
