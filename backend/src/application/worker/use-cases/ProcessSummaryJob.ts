import { getProviderKey, CHAT_SUMMARY_MODEL } from "../../../constants/models";
import { injectable, inject } from "tsyringe";
import { IOutboxEventRepository } from "../../../domain/outbox/repositories/IOutboxEventRepository";
import { IVectorRepository } from "../../../domain/vector/repositories/IVectorRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import {
  generateTripleMemoryOutput,
  TripleMemoryOutput,
  SummaryItem,
  ProfileDelta,
} from "../../../utils/AISummary";
import { embeddingService } from "../../../services/EmbeddingService";
import { IGlobalProfile } from "../../../domain/auth/entities/User";
import { estimateTokenCount } from "../../../utils/tokenCounter";
import crypto from "crypto";
import { ILogger } from "../../common/ports/ILogger";
import { getCachedDecryptedKeys } from "../../../utils/byokKeysHelper";
const MAX_SUMMARY_TOKENS = 900;

function renderSummaryItems(items: SummaryItem[]): string {
  return items.map((item) => `[${item.type}] ${item.content}`).join("\n");
}

function enforceSummaryBudget(items: SummaryItem[], logger: ILogger): SummaryItem[] {
  const initialText = renderSummaryItems(items);
  let estimatedTokens = estimateTokenCount(initialText);

  if (estimatedTokens <= MAX_SUMMARY_TOKENS) {
    return items;
  }

  logger.warn(
    `Summary is about ${estimatedTokens} tokens — trimming to ${MAX_SUMMARY_TOKENS}`,
  );

  const dropOrder: SummaryItem["type"][] = [
    "CONTEXT",
    "CONCEPT",
    "PROBLEM",
    "PROGRESS",
  ];

  const trimmed = [...items];

  for (const tag of dropOrder) {
    if (estimatedTokens <= MAX_SUMMARY_TOKENS) break;

    for (let i = trimmed.length - 1; i >= 0; i--) {
      if (trimmed[i].type === tag) {
        trimmed.splice(i, 1);
        estimatedTokens = estimateTokenCount(renderSummaryItems(trimmed));
        if (estimatedTokens <= MAX_SUMMARY_TOKENS) break;
      }
    }
  }

  while (estimatedTokens > MAX_SUMMARY_TOKENS && trimmed.length > 0) {
    trimmed.pop();
    estimatedTokens = estimateTokenCount(renderSummaryItems(trimmed));
  }

  return trimmed;
}

function mergeProfileDelta(
  existing: IGlobalProfile | null,
  delta: ProfileDelta,
): Record<string, any> | null {
  const updates: Record<string, string | string[]> = {};
  const profile = existing || {
    tech_stack: [],
    environment: [],
    user_preferences: [],
    current_projects: [],
    long_term_goals: [],
    constraints: [],
    entities: [],
  };

  const scalarFields = [
    "user_name",
    "location",
    "role",
    "expertise_level",
    "response_style",
  ] as const;

  for (const field of scalarFields) {
    if (delta[field] && delta[field] !== (profile as any)[field]) {
      updates[`globalProfile.${field}`] = String(delta[field]).slice(0, 100);
    }
  }

  
  const arrayFields = [
    "tech_stack",
    "environment",
    "current_projects",
    "long_term_goals",
    "constraints",
    "user_preferences",
    "entities",
  ] as const;

  const MAX_ARRAY_ITEMS = 15;
  const MAX_ITEM_LENGTH = 300;

  for (const field of arrayFields) {
    const deltaItems = delta[field];
    if (deltaItems && deltaItems.length > 0) {
      
      const existingItems: string[] = ((profile as any)[field] || [])
        .map((item: any) => String(item).slice(0, MAX_ITEM_LENGTH));
        
      const existingSet = new Set(
        existingItems.map((item: string) => item.toLowerCase()),
      );
      
      
      const newItems = deltaItems
        .map((item: any) => String(item).slice(0, MAX_ITEM_LENGTH))
        .filter((item) => !existingSet.has(item.toLowerCase()));

      if (newItems.length > 0) {
        const combined = [...existingItems, ...newItems];
     
        updates[`globalProfile.${field}`] = combined.slice(-MAX_ARRAY_ITEMS);
      }
    }
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

interface MessageToCompress {
  role: "user" | "assistant" | "system";
  content: string;
}

@injectable()
export class ProcessSummaryJob {
  constructor(
    @inject("IOutboxEventRepository")
    private outboxRepository: IOutboxEventRepository,
    @inject("IVectorRepository") private vectorRepository: IVectorRepository,
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("RedisClient") private redisConnection: any,
    @inject("ILogger") private logger: ILogger,
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

      const userId = outboxEvent.payload.userId.toString();

      const cacheKey = `triple_memory:${summaryOutboxEventId}`;
      const cachedResult = await this.redisConnection.get(cacheKey);

      let tripleOutput: TripleMemoryOutput;

      if (cachedResult) {
        this.logger.info(
          `Using cached triple-memory output for ${summaryOutboxEventId}`,
        );
        tripleOutput = JSON.parse(cachedResult);
      } else {
        this.logger.info(
          `Calling LLM for triple-memory output (${summaryOutboxEventId})`,
        );

        const user = await this.userRepository.findById(userId);
        const existingProfile = user?.globalProfile || null;

        
        const byokKeys = await getCachedDecryptedKeys(userId, "gemini");

        tripleOutput = await generateTripleMemoryOutput(
          messageToCompress,
          previousSummary || null,
          existingProfile,
          byokKeys,
          userId
        );

        let inputTokens = 0;
        let outputTokens = 0;
        if (tripleOutput.usageMetadata) {
          inputTokens = tripleOutput.usageMetadata.promptTokenCount || 0;
          outputTokens = tripleOutput.usageMetadata.candidatesTokenCount || 0;
        } else {
          const promptText = `CONVERSATION BATCH:\n${messageToCompress.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n\n")}`;
          inputTokens = estimateTokenCount(promptText);
          outputTokens = estimateTokenCount(JSON.stringify(tripleOutput));
        }
        const totalTokens = inputTokens + outputTokens;

        if (totalTokens > 0) {
          const provider = getProviderKey(CHAT_SUMMARY_MODEL);
          await this.userRepository.findByIdAndUpdate(userId, {
            $inc: {
              [`token_usage.${provider}.chatSummary.input`]: inputTokens,
              [`token_usage.${provider}.chatSummary.output`]: outputTokens,
              [`token_usage.${provider}.chatSummary.total`]: totalTokens,
              "tokensUsed": totalTokens
            }
          });
        }

        await this.redisConnection.setex(
          cacheKey,
          24 * 60 * 60,
          JSON.stringify(tripleOutput),
        );
      }

      await this.processCompressedFacts(
        tripleOutput.compressedFacts,
        outboxEvent,
        summaryOutboxEventId,
      );

  
      await this.processRecursiveSummary(
        tripleOutput.recursiveSummary,
        outboxEvent,
      );

   
      await this.processProfileDelta(tripleOutput.profileDelta, userId);

      await this.outboxRepository.updateStatus(
        summaryOutboxEventId,
        "processed",
      );
    } catch (error: any) {
      await this.outboxRepository.updateStatus(summaryOutboxEventId, "failed", {
        error: error.message,
        incrementRetry: true,
      });
      this.logger.error(`ProcessSummaryJob failed:`, error);
      throw error;
    }
  }

  

  private async processCompressedFacts(
    facts: string[],
    outboxEvent: any,
    summaryOutboxEventId: string,
  ) {
    const validFacts = facts.filter((f) => f.trim().length > 20);

    if (validFacts.length === 0) {
      this.logger.warn(`No valid facts for outbox ${summaryOutboxEventId}`);
      return;
    }

    const factsToEmbed = validFacts.slice(0, 50);
    if (validFacts.length > 50) {
      this.logger.warn(`High fact count (${validFacts.length}) — truncating to 50`);
    }

    const embeddings = await embeddingService.embedBatch(
      factsToEmbed,
      "RETRIEVAL_DOCUMENT",
    );

    const points = factsToEmbed.map((fact, i) => ({
      id: crypto.randomUUID(),
      vector: embeddings[i],
      payload: {
        ...outboxEvent.payload.metadata,
        sourceId: outboxEvent.payload.sourceId.toString(),
        sourceType: outboxEvent.payload.sourceType,
        userId: outboxEvent.payload.userId.toString(),
        content: { fact },
      },
    }));

    await this.vectorRepository.upsertSummaryVectors(points);
    this.logger.info(
      `Embedded ${points.length} fact chunks for outbox ${summaryOutboxEventId}`,
    );
  }

 

  private async processRecursiveSummary(
    summaryItems: SummaryItem[],
    outboxEvent: any,
  ) {
    if (!summaryItems || summaryItems.length === 0) return;

    const budgetedItems = enforceSummaryBudget(summaryItems, this.logger);

    
    const summaryText = renderSummaryItems(budgetedItems);

    await this.chatRepository.update(
      outboxEvent.payload.sourceId.toString(),
      outboxEvent.payload.userId.toString(),
      { summary: summaryText },
    );

    this.logger.info(
      `Summary updated for chat ${outboxEvent.payload.sourceId} ` +
        `(${budgetedItems.length} items, est. ${Math.ceil(summaryText.length / 4)} tokens)`,
    );
  }


  private async processProfileDelta(delta: ProfileDelta, userId: string) {
    if (!delta || Object.keys(delta).length === 0) {
      return;
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      this.logger.warn(`User not found for profile delta: ${userId}`);
      return;
    }

    const profileUpdates = mergeProfileDelta(user.globalProfile, delta);

    if (profileUpdates) {
      await this.userRepository.findByIdAndUpdate(userId, {
        $set: profileUpdates,
      });

      const updatedFields = Object.keys(profileUpdates)
        .map((k) => k.replace("globalProfile.", ""))
        .join(", ");

      this.logger.info(
        `Global profile updated for user ${userId}: ${updatedFields}`,
      );
    }
  }
}
