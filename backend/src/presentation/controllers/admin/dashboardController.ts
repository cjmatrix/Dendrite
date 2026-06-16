import { Request, Response } from "express";
import { container, inject, injectable } from "tsyringe";
import { GetAdminDashboardStats } from "../../../application/admin/dashboard/usecases/GetAdminDashboardStats";
import { BaseController } from "../base/BaseController";

@injectable()
class DashboardController extends BaseController {
  constructor(
    @inject("GetAdminDashboardStats") private getAdminDashboardStats: GetAdminDashboardStats
  ) {
    super();
  }

  async getStats(req: Request, res: Response) {
    const stats = await this.getAdminDashboardStats.execute();
    this.sendSuccess(res, stats, 200, "Dashboard stats retrieved successfully");
  }
}

export const dashboardController = container.resolve(DashboardController);
