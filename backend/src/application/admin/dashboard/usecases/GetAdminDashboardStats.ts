import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { IActiveUserTracker } from "../../../common/ports/IActiveUserTracker";
import { AdminDashboardStatsOutputDTO } from "../dtos/dashboard.dto";

@injectable()
export class GetAdminDashboardStats {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IActiveUserTracker") private activeUserTracker: IActiveUserTracker
  ) {}

  async execute(): Promise<AdminDashboardStatsOutputDTO> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalUsers, pendingApprovals, suspendedUsers, activeToday, activeNow, aggregationResult] = await Promise.all([
      this.userRepository.count({}),
      this.userRepository.count({ status: "pending" }),
      this.userRepository.count({ status: { $in: ["suspended", "banned"] } }),
      this.userRepository.count({ updatedAt: { $gte: twentyFourHoursAgo } }),
      this.activeUserTracker.getActiveCount(),
      this.userRepository.aggregate([
        {
          $match: {
            tier: { $ne: "byok" }
          }
        },
        {
          $group: {
            _id: null,
            mainChatInput: { $sum: "$token_usage.mainChat.input" },
            mainChatOutput: { $sum: "$token_usage.mainChat.output" },
            mainChatTotal: { $sum: "$token_usage.mainChat.total" },

            chatSummaryInput: { $sum: "$token_usage.chatSummary.input" },
            chatSummaryOutput: { $sum: "$token_usage.chatSummary.output" },
            chatSummaryTotal: { $sum: "$token_usage.chatSummary.total" },

            codeDescriptionInput: { $sum: "$token_usage.codeDescription.input" },
            codeDescriptionOutput: { $sum: "$token_usage.codeDescription.output" },
            codeDescriptionTotal: { $sum: "$token_usage.codeDescription.total" },

            p5VisualizationInput: { $sum: "$token_usage.p5Visualization.input" },
            p5VisualizationOutput: { $sum: "$token_usage.p5Visualization.output" },
            p5VisualizationTotal: { $sum: "$token_usage.p5Visualization.total" },

            quickChatInput: { $sum: "$token_usage.quickChat.input" },
            quickChatOutput: { $sum: "$token_usage.quickChat.output" },
            quickChatTotal: { $sum: "$token_usage.quickChat.total" }
          }
        }
      ])
    ]);

    const stats = aggregationResult[0] || {};
    const mainChat = {
      input: stats.mainChatInput || 0,
      output: stats.mainChatOutput || 0,
      total: stats.mainChatTotal || 0
    };
    const chatSummary = {
      input: stats.chatSummaryInput || 0,
      output: stats.chatSummaryOutput || 0,
      total: stats.chatSummaryTotal || 0
    };
    const codeDescription = {
      input: stats.codeDescriptionInput || 0,
      output: stats.codeDescriptionOutput || 0,
      total: stats.codeDescriptionTotal || 0
    };
    const p5Visualization = {
      input: stats.p5VisualizationInput || 0,
      output: stats.p5VisualizationOutput || 0,
      total: stats.p5VisualizationTotal || 0
    };
    const quickChat = {
      input: stats.quickChatInput || 0,
      output: stats.quickChatOutput || 0,
      total: stats.quickChatTotal || 0
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
