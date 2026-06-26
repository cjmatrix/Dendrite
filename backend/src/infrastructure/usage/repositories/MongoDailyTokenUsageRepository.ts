import { injectable } from "tsyringe";
import { IDailyTokenUsageRepository } from "../../../domain/usage/repositories/IDailyTokenUsageRepository";
import { DailyTokenUsage } from "../models/MongoDailyTokenUsageModel";

@injectable()
export class MongoDailyTokenUsageRepository implements IDailyTokenUsageRepository {
  async upsertUsage(
    userId: string,
    date: Date,
    tier: string,
    increments: Record<string, number>
  ): Promise<void> {
    await DailyTokenUsage.updateOne(
      { userId, date },
      {
        $setOnInsert: { tierAtTime: tier },
        $inc: increments,
      },
      { upsert: true }
    );
  }

  async aggregateGlobalUsage(
    startDate: Date,
    endDate: Date,
    tier?: string,
    provider?: string
  ): Promise<Record<string, unknown>[]> {
    const matchStage: Record<string, unknown> = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (tier && tier !== "all") {
      matchStage.tierAtTime = tier;
    } else {
      matchStage.tierAtTime = { $ne: "byok" };
    }

    const providers = ["google", "anthropic", "openai", "openrouter", "groq", "mistral"];
    const targetProviders = provider && provider !== "all" ? [provider] : providers;

    const buildSumField = (feature: string, type: string) => {
      const paths = targetProviders.map((p) => ({ $ifNull: [`$token_usage.${p}.${feature}.${type}`, 0] }));
      if (paths.length === 1) {
        return { $sum: paths[0] };
      }
      return {
        $sum: {
          $add: paths
        }
      };
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupStage: any = {
      _id: null,
      mainChatInput: buildSumField("mainChat", "input"),
      mainChatOutput: buildSumField("mainChat", "output"),
      mainChatTotal: buildSumField("mainChat", "total"),

      chatSummaryInput: buildSumField("chatSummary", "input"),
      chatSummaryOutput: buildSumField("chatSummary", "output"),
      chatSummaryTotal: buildSumField("chatSummary", "total"),

      codeDescriptionInput: buildSumField("codeDescription", "input"),
      codeDescriptionOutput: buildSumField("codeDescription", "output"),
      codeDescriptionTotal: buildSumField("codeDescription", "total"),

      p5VisualizationInput: buildSumField("p5Visualization", "input"),
      p5VisualizationOutput: buildSumField("p5Visualization", "output"),
      p5VisualizationTotal: buildSumField("p5Visualization", "total"),

      quickChatInput: buildSumField("quickChat", "input"),
      quickChatOutput: buildSumField("quickChat", "output"),
      quickChatTotal: buildSumField("quickChat", "total")
    };

    return await DailyTokenUsage.aggregate([
      {
        $match: matchStage
      },
      {
        $group: groupStage
      }
    ]);
  }
}
