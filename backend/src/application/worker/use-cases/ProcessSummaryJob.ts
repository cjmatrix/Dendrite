import { injectable, inject } from "tsyringe";
import { IOutboxEventRepository } from "../../../domain/outbox/repositories/IOutboxEventRepository";
import { IVectorRepository } from "../../../domain/vector/repositories/IVectorRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { generateDualMemoryOutput } from "../../../utils/AISummary";
import { embeddingService } from "../../../services/EmbeddingService";
import crypto from "crypto";

const SUMMARY_MAX_TOKENS = 900;

function enforceSummaryBudget(
  summary: string,
  maxTokens: number = SUMMARY_MAX_TOKENS,
): string {
  const estimatedTokens = Math.ceil(summary.length / 4);

  if (estimatedTokens <= maxTokens) {
    return summary;
  }

  console.warn(
    `Summary over budget — est. ${estimatedTokens} tokens, trimming to ${maxTokens}`,
  );

  const lines = summary
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const dropOrder = ["[CONTEXT]", "[CONCEPT]", "[PROBLEM]", "[PROGRESS]"];
  let trimmed = [...lines];

  for (const tag of dropOrder) {
    const currentTokens = Math.ceil(trimmed.join("\n").length / 4);
    if (currentTokens <= maxTokens) break;

    for (let i = trimmed.length - 1; i >= 0; i--) {
      if (trimmed[i].startsWith(tag)) {
        trimmed.splice(i, 1);
        break;
      }
    }
  }

  const result = trimmed.join("\n");
  const finalTokens = Math.ceil(result.length / 4);

  if (finalTokens > maxTokens) {
    const charLimit = maxTokens * 4;
    const sliced = result.slice(0, charLimit);
    const lastNewline = sliced.lastIndexOf("\n");
    return lastNewline > 0 ? sliced.slice(0, lastNewline) : sliced;
  }

  return result;
}

interface MessageToCompress {
  role: "user" | "assistant" | "system";
  content: string;
}

@injectable()
export class ProcessSummaryJob {
  constructor(
    @inject("IOutboxEventRepository") private outboxRepository: IOutboxEventRepository,
    @inject("IVectorRepository") private vectorRepository: IVectorRepository,
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("RedisClient") private redisConnection: any,
  ) {}

  async execute(
    summaryOutboxEventId: string,
    messageToCompress: MessageToCompress[],
    previousSummary?: string | null,
  ) {
    try {
      const outboxEvent =
        await this.outboxRepository.findById(summaryOutboxEventId);
      if (!outboxEvent) {
        throw new Error(`Outbox event not found: ${summaryOutboxEventId}`);
      }

      const cacheKey = `dual_memory:${summaryOutboxEventId}`;
      let cachedResult = await this.redisConnection.get(cacheKey);

      let compressedFacts: string;
      let recursiveSummary: string;

      if (cachedResult) {
        console.log(
          `Using cached dual-memory output for ${summaryOutboxEventId}`,
        );
        const parsed = JSON.parse(cachedResult);
        compressedFacts = parsed.compressedFacts;
        recursiveSummary = parsed.recursiveSummary;
      } else {
        console.log(
          `Calling LLM for dual-memory output (${summaryOutboxEventId})`,
        );
        const dualOutput = await generateDualMemoryOutput(
          messageToCompress,
          previousSummary || null,
        );
        compressedFacts = dualOutput.compressedFacts;
        recursiveSummary = dualOutput.recursiveSummary;

        await this.redisConnection.setex(
          cacheKey,
          24 * 60 * 60,
          JSON.stringify({ compressedFacts, recursiveSummary }),
        );
      }

      const contextChunks = compressedFacts
        .split(/\s*(?:\|\|\||\n+)\s*/)
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 20);

      if (contextChunks.length > 50) {
        console.warn(
          `High chunk count (${contextChunks.length}) — truncating to 50`,
        );
        contextChunks.splice(50);
      }

      if (contextChunks.length > 0) {
        const embeddings = await embeddingService.embedBatch(
          contextChunks,
          "RETRIEVAL_DOCUMENT",
        );

        const points = contextChunks.map((chunk, i) => ({
          id: crypto.randomUUID(),
          vector: embeddings[i],
          payload: {
            ...outboxEvent.payload.metadata,
            sourceId: outboxEvent.payload.sourceId.toString(),
            sourceType: outboxEvent.payload.sourceType,
            userId: outboxEvent.payload.userId.toString(),
            content: { fact: chunk },
          },
        }));

        await this.vectorRepository.upsertSummaryVectors(points);
        console.log(
          `Embedded ${points.length} fact chunks for outbox ${summaryOutboxEventId}`,
        );
      } else {
        console.warn(`No valid chunks for outbox ${summaryOutboxEventId}`);
      }

    
      if (recursiveSummary) {
        const budgetedSummary = enforceSummaryBudget(recursiveSummary);

        await this.chatRepository.update(
          outboxEvent.payload.sourceId.toString(),
          outboxEvent.payload.userId.toString(),
          { summary: budgetedSummary },
        );

        console.log(
          `Summary updated for chat ${outboxEvent.payload.sourceId} ` +
            `(est. ${Math.ceil(budgetedSummary.length / 4)} tokens)`,
        );
      }

      await this.outboxRepository.updateStatus(
        summaryOutboxEventId,
        "processed",
      );
    } catch (error: any) {
      await this.outboxRepository.updateStatus(summaryOutboxEventId, "failed", {
        error: error.message,
        incrementRetry: true,
      });
      console.error(`ProcessSummaryJob failed:`, error.message);
      throw error;
    }
  }
}
