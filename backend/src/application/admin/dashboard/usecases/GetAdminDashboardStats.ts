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
            mainChatInput: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.mainChat.input", 0] },
                  { $ifNull: ["$token_usage.anthropic.mainChat.input", 0] },
                  { $ifNull: ["$token_usage.openai.mainChat.input", 0] },
                  { $ifNull: ["$token_usage.openrouter.mainChat.input", 0] },
                  { $ifNull: ["$token_usage.groq.mainChat.input", 0] },
                  { $ifNull: ["$token_usage.mistral.mainChat.input", 0] }
                ]
              }
            },
            mainChatOutput: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.mainChat.output", 0] },
                  { $ifNull: ["$token_usage.anthropic.mainChat.output", 0] },
                  { $ifNull: ["$token_usage.openai.mainChat.output", 0] },
                  { $ifNull: ["$token_usage.openrouter.mainChat.output", 0] },
                  { $ifNull: ["$token_usage.groq.mainChat.output", 0] },
                  { $ifNull: ["$token_usage.mistral.mainChat.output", 0] }
                ]
              }
            },
            mainChatTotal: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.mainChat.total", 0] },
                  { $ifNull: ["$token_usage.anthropic.mainChat.total", 0] },
                  { $ifNull: ["$token_usage.openai.mainChat.total", 0] },
                  { $ifNull: ["$token_usage.openrouter.mainChat.total", 0] },
                  { $ifNull: ["$token_usage.groq.mainChat.total", 0] },
                  { $ifNull: ["$token_usage.mistral.mainChat.total", 0] }
                ]
              }
            },

            chatSummaryInput: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.chatSummary.input", 0] },
                  { $ifNull: ["$token_usage.anthropic.chatSummary.input", 0] },
                  { $ifNull: ["$token_usage.openai.chatSummary.input", 0] },
                  { $ifNull: ["$token_usage.openrouter.chatSummary.input", 0] },
                  { $ifNull: ["$token_usage.groq.chatSummary.input", 0] },
                  { $ifNull: ["$token_usage.mistral.chatSummary.input", 0] }
                ]
              }
            },
            chatSummaryOutput: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.chatSummary.output", 0] },
                  { $ifNull: ["$token_usage.anthropic.chatSummary.output", 0] },
                  { $ifNull: ["$token_usage.openai.chatSummary.output", 0] },
                  { $ifNull: ["$token_usage.openrouter.chatSummary.output", 0] },
                  { $ifNull: ["$token_usage.groq.chatSummary.output", 0] },
                  { $ifNull: ["$token_usage.mistral.chatSummary.output", 0] }
                ]
              }
            },
            chatSummaryTotal: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.chatSummary.total", 0] },
                  { $ifNull: ["$token_usage.anthropic.chatSummary.total", 0] },
                  { $ifNull: ["$token_usage.openai.chatSummary.total", 0] },
                  { $ifNull: ["$token_usage.openrouter.chatSummary.total", 0] },
                  { $ifNull: ["$token_usage.groq.chatSummary.total", 0] },
                  { $ifNull: ["$token_usage.mistral.chatSummary.total", 0] }
                ]
              }
            },

            codeDescriptionInput: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.codeDescription.input", 0] },
                  { $ifNull: ["$token_usage.anthropic.codeDescription.input", 0] },
                  { $ifNull: ["$token_usage.openai.codeDescription.input", 0] },
                  { $ifNull: ["$token_usage.openrouter.codeDescription.input", 0] },
                  { $ifNull: ["$token_usage.groq.codeDescription.input", 0] },
                  { $ifNull: ["$token_usage.mistral.codeDescription.input", 0] }
                ]
              }
            },
            codeDescriptionOutput: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.codeDescription.output", 0] },
                  { $ifNull: ["$token_usage.anthropic.codeDescription.output", 0] },
                  { $ifNull: ["$token_usage.openai.codeDescription.output", 0] },
                  { $ifNull: ["$token_usage.openrouter.codeDescription.output", 0] },
                  { $ifNull: ["$token_usage.groq.codeDescription.output", 0] },
                  { $ifNull: ["$token_usage.mistral.codeDescription.output", 0] }
                ]
              }
            },
            codeDescriptionTotal: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.codeDescription.total", 0] },
                  { $ifNull: ["$token_usage.anthropic.codeDescription.total", 0] },
                  { $ifNull: ["$token_usage.openai.codeDescription.total", 0] },
                  { $ifNull: ["$token_usage.openrouter.codeDescription.total", 0] },
                  { $ifNull: ["$token_usage.groq.codeDescription.total", 0] },
                  { $ifNull: ["$token_usage.mistral.codeDescription.total", 0] }
                ]
              }
            },

            p5VisualizationInput: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.p5Visualization.input", 0] },
                  { $ifNull: ["$token_usage.anthropic.p5Visualization.input", 0] },
                  { $ifNull: ["$token_usage.openai.p5Visualization.input", 0] },
                  { $ifNull: ["$token_usage.openrouter.p5Visualization.input", 0] },
                  { $ifNull: ["$token_usage.groq.p5Visualization.input", 0] },
                  { $ifNull: ["$token_usage.mistral.p5Visualization.input", 0] }
                ]
              }
            },
            p5VisualizationOutput: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.p5Visualization.output", 0] },
                  { $ifNull: ["$token_usage.anthropic.p5Visualization.output", 0] },
                  { $ifNull: ["$token_usage.openai.p5Visualization.output", 0] },
                  { $ifNull: ["$token_usage.openrouter.p5Visualization.output", 0] },
                  { $ifNull: ["$token_usage.groq.p5Visualization.output", 0] },
                  { $ifNull: ["$token_usage.mistral.p5Visualization.output", 0] }
                ]
              }
            },
            p5VisualizationTotal: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.p5Visualization.total", 0] },
                  { $ifNull: ["$token_usage.anthropic.p5Visualization.total", 0] },
                  { $ifNull: ["$token_usage.openai.p5Visualization.total", 0] },
                  { $ifNull: ["$token_usage.openrouter.p5Visualization.total", 0] },
                  { $ifNull: ["$token_usage.groq.p5Visualization.total", 0] },
                  { $ifNull: ["$token_usage.mistral.p5Visualization.total", 0] }
                ]
              }
            },

            quickChatInput: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.quickChat.input", 0] },
                  { $ifNull: ["$token_usage.anthropic.quickChat.input", 0] },
                  { $ifNull: ["$token_usage.openai.quickChat.input", 0] },
                  { $ifNull: ["$token_usage.openrouter.quickChat.input", 0] },
                  { $ifNull: ["$token_usage.groq.quickChat.input", 0] },
                  { $ifNull: ["$token_usage.mistral.quickChat.input", 0] }
                ]
              }
            },
            quickChatOutput: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.quickChat.output", 0] },
                  { $ifNull: ["$token_usage.anthropic.quickChat.output", 0] },
                  { $ifNull: ["$token_usage.openai.quickChat.output", 0] },
                  { $ifNull: ["$token_usage.openrouter.quickChat.output", 0] },
                  { $ifNull: ["$token_usage.groq.quickChat.output", 0] },
                  { $ifNull: ["$token_usage.mistral.quickChat.output", 0] }
                ]
              }
            },
            quickChatTotal: {
              $sum: {
                $add: [
                  { $ifNull: ["$token_usage.google.quickChat.total", 0] },
                  { $ifNull: ["$token_usage.anthropic.quickChat.total", 0] },
                  { $ifNull: ["$token_usage.openai.quickChat.total", 0] },
                  { $ifNull: ["$token_usage.openrouter.quickChat.total", 0] },
                  { $ifNull: ["$token_usage.groq.quickChat.total", 0] },
                  { $ifNull: ["$token_usage.mistral.quickChat.total", 0] }
                ]
              }
            }
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
