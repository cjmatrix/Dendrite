import { getProviderKey, CODE_DESCRIPTION_MODEL } from "../../../constants/models";
import { injectable, inject } from "tsyringe";
import { ICodeBlockRepository } from '../../../domain/chat/repositories/ICodeBlockRepository';
import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { IEmbeddingPublisher } from '../../common/ports/IEmbeddingPublisher';
import { generateBatchCodeDescriptions } from '../../../utils/AIDescription';
import { ILogger } from '../../common/ports/ILogger';
import { IUnitOfWorkRepository } from "../../common/ports/IUnitOfWorkRepository";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import {getCachedDecryptedKeys} from "../../../utils/byokKeysHelper";
import { IDailyTokenUsageRepository } from "../../../domain/usage/repositories/IDailyTokenUsageRepository";
@injectable()
export class ProcessDescriptionJob {
  constructor(
    @inject("ICodeBlockRepository") private codeBlockRepository: ICodeBlockRepository,
    @inject("IOutboxEventRepository") private outboxRepository: IOutboxEventRepository,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @inject("RedisClient") private redisConnection: any, 
    @inject("IEmbeddingPublisher") private embeddingPublisher: IEmbeddingPublisher,
    @inject("IUnitOfWorkRepository") private unitOfWork: IUnitOfWorkRepository,
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("ILogger") private logger: ILogger,
    @inject("IDailyTokenUsageRepository") private dailyTokenUsageRepository: IDailyTokenUsageRepository
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(blocks: any[]) {
    const finalResults: { [key: string]: string } = {};
    const toProcessBlocks: typeof blocks = [];

    
    for (const block of blocks) {
      const redisKey = `code_dedup:${block.hash}`;
      const cachedDescription = await this.redisConnection.get(redisKey);
      
      if (cachedDescription) {
        this.logger.info(`[DescWorker] Hash cache hit for ${block.hash.slice(0, 8)}... — skipping Gemini call.`);
        finalResults[block._id] = cachedDescription;
      } else {
        toProcessBlocks.push(block);
      }
    }
    
  
    if (toProcessBlocks.length > 0) {
      this.logger.info(` Batching description generation for ${toProcessBlocks.length} blocks...`);
      
      let byokKeys: string[] | undefined;
      const firstBlock = toProcessBlocks[0] || blocks[0];
      if (firstBlock && firstBlock.userId) {
        
        byokKeys = await getCachedDecryptedKeys(firstBlock.userId.toString(), "gemini");
      }

      const { results: batchResults, usageMetadata } = await generateBatchCodeDescriptions(
        toProcessBlocks.map(b => ({ id: b._id, code: b.code, language: b.language })),
        byokKeys,
        firstBlock && firstBlock.userId ? firstBlock.userId.toString() : undefined
      );

      
      if (firstBlock && firstBlock.userId) {
        const userIdStr = firstBlock.userId.toString();
        let inputTokens = 0;
        let outputTokens = 0;
        if (usageMetadata) {
          inputTokens = usageMetadata.promptTokenCount || 0;
          outputTokens = usageMetadata.candidatesTokenCount || 0;
        } else {
          const { estimateTokenCount } = require("../../../utils/tokenCounter");
          const promptText = toProcessBlocks.map(b => b.code).join("\n");
          console.log(promptText)
          inputTokens = estimateTokenCount(promptText);
          outputTokens = estimateTokenCount(JSON.stringify(batchResults));
        }
        const totalTokens = inputTokens + outputTokens;

        if (totalTokens > 0) {
          const provider = getProviderKey(CODE_DESCRIPTION_MODEL);
          await this.userRepository.findByIdAndUpdate(userIdStr, {
            $inc: {
              [`token_usage.${provider}.codeDescription.input`]: inputTokens,
              [`token_usage.${provider}.codeDescription.output`]: outputTokens,
              [`token_usage.${provider}.codeDescription.total`]: totalTokens,
              "tokensUsed": totalTokens
            }
          });

          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);

          const user = await this.userRepository.findByIdSafe(userIdStr);
          const userTier = user?.tier || "free";

          await this.dailyTokenUsageRepository.upsertUsage(userIdStr, today, userTier, {
            [`token_usage.${provider}.codeDescription.input`]: inputTokens,
            [`token_usage.${provider}.codeDescription.output`]: outputTokens,
            [`token_usage.${provider}.codeDescription.total`]: totalTokens,
          });
        }

        console.log(inputTokens,outputTokens)
      }

      for (const res of batchResults) {
        finalResults[res.id] = res.description;
        const originalBlock = toProcessBlocks.find(b => b._id === res.id);
        if (originalBlock) {
          await this.redisConnection.setex(`code_dedup:${originalBlock.hash}`, 86400, res.description);
        }
      }
    }

    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const codeBlockUpdates: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outboxEventsToPush: any[] = [];

    for (const block of blocks) {
      const description = finalResults[block._id];
      if (!description) continue; 

      codeBlockUpdates.push({
        updateOne: {
          filter: { _id: block._id },
          update: { $set: { description, needsDescription: false } },
        },
      });

      outboxEventsToPush.push({
        eventType: "CODE_BLOCK_CREATED",
        payload: {
          sourceId: block._id,
          sourceType: "code_block",
          userId: block.userId,
          content: {
            code: block.code,
            description,
          },
          metadata: { language: block.language, chatId: block.chatId },
        },
        status: "pending",
      });
    }

    
    if (codeBlockUpdates.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let savedOutboxEvents: any[] = [];

      await this.unitOfWork.runInTransaction(async () => {
        await this.codeBlockRepository.bulkUpdateDescriptions(codeBlockUpdates);
        savedOutboxEvents = await this.outboxRepository.insertMany(outboxEventsToPush);
      });

      for (const event of savedOutboxEvents) {
        try {
          await this.embeddingPublisher.publish(event._id.toString(), event.payload.content);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          this.logger.error(`Status: Failed to push to embedding queue for ${event.payload.sourceId}:`, e);
        }
      }
    }
  }
}
