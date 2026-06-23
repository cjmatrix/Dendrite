import { Request, Response } from "express";
import { container, inject, injectable } from "tsyringe";
import { GetAdminDashboardStats } from "../../../application/admin/dashboard/usecases/GetAdminDashboardStats";
import { GetSubscriptionStats } from "../../../application/admin/dashboard/usecases/GetSubscriptionStats";
import { GetSystemHealth } from "../../../application/admin/dashboard/usecases/GetSystemHealth";
import { BaseController } from "../base/BaseController";

@injectable()
class DashboardController extends BaseController {
  constructor(
    @inject("GetAdminDashboardStats") private getAdminDashboardStats: GetAdminDashboardStats,
    @inject("GetSubscriptionStats") private getSubscriptionStatsUseCase: GetSubscriptionStats,
    @inject("GetSystemHealth") private getSystemHealthUseCase: GetSystemHealth
  ) {
    super();
  }

  async getStats(req: Request, res: Response) {
    const stats = await this.getAdminDashboardStats.execute();
    this.sendSuccess(res, stats, 200, "Dashboard stats retrieved successfully");
  }

  async getSubscriptionStats(req: Request, res: Response) {
    const { timeframe, startDate, endDate } = req.query;
    const stats = await this.getSubscriptionStatsUseCase.execute({
      timeframe: timeframe as any,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    this.sendSuccess(res, stats, 200, "Subscription stats retrieved successfully");
  }

  async getHealth(req: Request, res: Response) {
    const healthReport = await this.getSystemHealthUseCase.execute();
    this.sendSuccess(res, healthReport, 200, "System health report retrieved successfully");
  }
}

export const dashboardController = container.resolve(DashboardController);
