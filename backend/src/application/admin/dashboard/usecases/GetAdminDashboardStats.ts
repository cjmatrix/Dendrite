import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { IActiveUserTracker } from "../../../common/ports/IActiveUserTracker";
import { IDailyTokenUsageRepository } from "../../../../domain/usage/repositories/IDailyTokenUsageRepository";
import { AdminDashboardStatsOutputDTO } from "../dtos/dashboard.dto";

@injectable()
export class GetAdminDashboardStats {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IActiveUserTracker") private activeUserTracker: IActiveUserTracker,
    @inject("IDailyTokenUsageRepository") private dailyTokenUsageRepository: IDailyTokenUsageRepository
  ) {}

  async execute(input?: { startDate?: string; endDate?: string; tier?: string; provider?: string }): Promise<AdminDashboardStatsOutputDTO> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let startDate = input?.startDate ? new Date(input.startDate) : new Date(0);
    let endDate = input?.endDate ? new Date(input.endDate) : new Date();
    const tier = input?.tier;

    const userFilter: Record<string, unknown> = {};
    if (tier && tier !== "all") {
      userFilter.tier = tier;
    }

    const pendingFilter = { ...userFilter, status: "pending" };
    const suspendedFilter = { ...userFilter, status: { $in: ["suspended", "banned"] } };
    const activeTodayFilter = { ...userFilter, updatedAt: { $gte: twentyFourHoursAgo } };

    
    let activeNowPromise: Promise<number>;
    if (tier && tier !== "all") {
      activeNowPromise = (async () => {
        const activeIds = await this.activeUserTracker.getActiveUserIds();
        console.log(activeIds)
        const validObjectIds = activeIds.filter(id => /^[a-f\d]{24}$/i.test(id));
        if (validObjectIds.length === 0) return 0;
        return await this.userRepository.count({
          _id: { $in: validObjectIds },
          tier: tier
        });
      })();
    } else {
      activeNowPromise = this.activeUserTracker.getActiveCount();
    }

    const [totalUsers, pendingApprovals, suspendedUsers, activeToday, activeNow, usageAggregation] = await Promise.all([
      this.userRepository.count(userFilter),
      this.userRepository.count(pendingFilter),
      this.userRepository.count(suspendedFilter),
      this.userRepository.count(activeTodayFilter),
      activeNowPromise,
      this.dailyTokenUsageRepository.aggregateGlobalUsage(startDate, endDate, tier, input?.provider)
    ]);

    const stats = usageAggregation[0] || {};
    const mainChat = {
      input: (stats.mainChatInput as number) || 0,
      output: (stats.mainChatOutput as number) || 0,
      total: (stats.mainChatTotal as number) || 0
    };
    const chatSummary = {
      input: (stats.chatSummaryInput as number) || 0,
      output: (stats.chatSummaryOutput as number) || 0,
      total: (stats.chatSummaryTotal as number) || 0
    };
    const codeDescription = {
      input: (stats.codeDescriptionInput as number) || 0,
      output: (stats.codeDescriptionOutput as number) || 0,
      total: (stats.codeDescriptionTotal as number) || 0
    };
    const p5Visualization = {
      input: (stats.p5VisualizationInput as number) || 0,
      output: (stats.p5VisualizationOutput as number) || 0,
      total: (stats.p5VisualizationTotal as number) || 0
    };
    const quickChat = {
      input: (stats.quickChatInput as number) || 0,
      output: (stats.quickChatOutput as number) || 0,
      total: (stats.quickChatTotal as number) || 0
    };

    const totalTokens = mainChat.total + chatSummary.total + codeDescription.total + p5Visualization.total + quickChat.total;

    return {
      totalUsers,
      activeToday,
      activeNow,
      pendingApprovals,
      suspendedUsers,
      tokenUsage: {
        mainChat,
        chatSummary,
        codeDescription,
        p5Visualization,
        quickChat,
        totalTokens
      }
    };
  }
}
