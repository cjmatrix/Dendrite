import { getProviderKey } from "../../../constants/models";
import { AppError } from "../../../utils/AppError";
import { hashCode } from "../../../utils/stripComments";
import { redisConnection } from "../../../config/redis";
import mongoose from "mongoose";
import CONTEXT_WINDOW from "../../../constants/contextWindow";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { ICodeBlockRepository } from "../../../domain/chat/repositories/ICodeBlockRepository";
import { IOutboxEventRepository } from "../../../domain/outbox/repositories/IOutboxEventRepository";
import { IDescriptionPublisher } from "../../common/ports/IDescriptionPublisher";
import { ISummaryPublisher } from "../../common/ports/ISummaryPublisher";
import { estimateTokenCount } from "../../../utils/tokenCounter";
import { ILogger } from "../../common/ports/ILogger";
import { IUnitOfWorkRepository } from "../../common/ports/IUnitOfWorkRepository";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { injectable, inject } from "tsyringe";
import { ISaveModelReplyUseCase } from "./interfaces";

export function extractCodeBlocks(text: string) {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: { language: string; code: string; hash: string }[] = [];

  let match;
  const filterLang = ["plantuml", "p5"];
  while ((match = regex.exec(text)) !== null) {
    const lang = (match[1] || "text").toLowerCase();
    const code = match[2].trim();
    if (!filterLang.includes(lang) && estimateTokenCount(code) > 60) {
      blocks.push({
        language: lang,
        code,
        hash: hashCode(code),
      });
    }
  }
  return blocks;
}

@injectable()
export class SaveModelReply implements ISaveModelReplyUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
    @inject("ICodeBlockRepository")
    private codeBlockRepository: ICodeBlockRepository,
    @inject("IOutboxEventRepository")
    private outboxRepository: IOutboxEventRepository,
    @inject("IDescriptionPublisher")
    private descriptionPublisher: IDescriptionPublisher,
    @inject("ISummaryPublisher") private summaryPublisher: ISummaryPublisher,
    @inject("IUnitOfWorkRepository") private unitOfWork: IUnitOfWorkRepository,
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("ILogger") private logger: ILogger,
  ) {}

  async execute(input: import("../dtos/chat.dto").SaveModelReplyInputDTO) {
    const { chatId, userId, modelReply, parentContext, parentSummary, promptTokens, responseTokens, contents, model } = input;

    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    let modelMessageId: string | null = null;
    let summaryOutboxEvent: any = null;
    let messageToCompress: any[] = [];

    await this.unitOfWork.runInTransaction(async () => {
      const [modelMsg] = await this.messageRepository.createMany(
        [{ chatId, userId, role: "model", content: modelReply }]
      );
      modelMessageId = modelMsg._id.toString();

      // Accumulate token usage
      let p5Tokens = 0;
      const p5Regex = /```p5\n([\s\S]*?)```/g;
      let p5Match;
      while ((p5Match = p5Regex.exec(modelReply)) !== null) {
        const p5Code = p5Match[1].trim();
        p5Tokens += estimateTokenCount(p5Code);
      }

      const calculatedPromptTokens = promptTokens !== undefined ? promptTokens : estimateTokenCount(JSON.stringify(contents || ""));
      const calculatedResponseTokens = responseTokens !== undefined ? responseTokens : estimateTokenCount(modelReply);

      const p5VisualizationTokens = p5Tokens;
      const mainChatOutputTokens = Math.max(0, calculatedResponseTokens - p5Tokens);

      const provider = getProviderKey(model);

      await this.userRepository.findByIdAndUpdate(userId, {
        $inc: {
          [`token_usage.${provider}.mainChat.input`]: calculatedPromptTokens,
          [`token_usage.${provider}.mainChat.output`]: mainChatOutputTokens,
          [`token_usage.${provider}.mainChat.total`]: calculatedPromptTokens + mainChatOutputTokens,
          [`token_usage.${provider}.p5Visualization.input`]: 0,
          [`token_usage.${provider}.p5Visualization.output`]: p5VisualizationTokens,
          [`token_usage.${provider}.p5Visualization.total`]: p5VisualizationTokens,
          "tokensUsed": calculatedPromptTokens + calculatedResponseTokens
        }
      });

      const updatedChat = await this.chatRepository.update(
        chatId,
        userId,
        { $inc: { unsummarizedCount: 2 } }
      );

      if (!updatedChat) {
        throw new AppError("Failed to update chat", 500);
      }

      let totalUnCount = updatedChat.unsummarizedCount;
      const totalParentMessagesToCompress: any[] = [];
      const lineageChatIds = [chatId];

      if (parentContext && parentContext.size > 0) {
        [...parentContext.entries()].forEach(([parentChatId, obj]) => {
          totalUnCount += obj.count;
          if (obj.count !== 0) {
            totalParentMessagesToCompress.push(...obj.messages);
          }
        });
      }

      if (updatedChat && totalUnCount >= CONTEXT_WINDOW) {
        const recent = await this.messageRepository.findRecentByChatId(
          chatId,
          CONTEXT_WINDOW
        );
        const totalRecent = [...recent, ...totalParentMessagesToCompress];
        messageToCompress = totalRecent.reverse();
        this.logger.debug(`Compressed messages for chat`, { chatId, messageCount: messageToCompress.length });

        await this.chatRepository.bulkResetUnsummarizedCount(
          lineageChatIds,
          userId
        );
      }

      const codeBlocks = extractCodeBlocks(modelReply);
      let savedBlocks: any[] = [];

      if (codeBlocks.length > 0) {
        const newBlockDocs: any[] = [];
        for (const block of codeBlocks) {
          const redisKey = `code_dedup:${block.hash}`;

          const cachedDesc = await redisConnection.get(redisKey);
          if (cachedDesc) {
            this.logger.debug(`[CodeDedup] Redis cache hit for code block`, { hash: block.hash.slice(0, 8) });
            continue;
          }

          const existingBlock = await this.codeBlockRepository.findByHash(
            block.hash,
          );
          if (existingBlock) {
            this.logger.debug(`[CodeDedup] Database cache hit for code block`, { hash: block.hash.slice(0, 8), blockId: existingBlock._id });

            if (existingBlock.description) {
              await redisConnection.setex(
                redisKey,
                86400,
                existingBlock.description,
              );
            }
            continue;
          }

          newBlockDocs.push({
            userId,
            chatId,
            code: block.code,
            language: block.language,
            hash: block.hash,
            description: "",
          });
        }

        if (newBlockDocs.length > 0) {
          savedBlocks = await this.codeBlockRepository.insertMany(
            newBlockDocs
          );
          this.logger.info(`[CodeDedup] New code blocks processed`, { newBlocks: newBlockDocs.length, duplicates: codeBlocks.length - newBlockDocs.length, total: codeBlocks.length });
        } else {
          this.logger.info(`[CodeDedup] All code blocks were duplicates`, { count: codeBlocks.length, chatId });
        }
      }

      if (messageToCompress.length > 0) {
        await this.codeBlockRepository.markUndescribedAsNeedingDescription(chatId);

        const outboxDoc = {
          eventType: "CHAT_SUMMARY_CREATED",
          payload: {
            sourceId: chat._id,
            sourceType: "chat_summary",
            userId,
            content: {
              messages: messageToCompress,
            },
            metadata: { chatId, previousSummary: chat.summary||parentSummary },
          },
          status: "pending",
        };
        const savedOutbox = await this.outboxRepository.insertMany(
          [outboxDoc]
        );
        summaryOutboxEvent = savedOutbox[0];
      }
    });

    if (messageToCompress.length > 0) {
      const undescribedBlocks =
        await this.codeBlockRepository.findUndescribedByChatId(chatId);
      if (undescribedBlocks.length > 0) {
        const queuePayload = undescribedBlocks.map((b: any) => ({
          _id: b._id.toString(),
          userId: b.userId,
          chatId: b.chatId,
          code: b.code,
          language: b.language,
          hash: b.hash,
        }));
        await this.descriptionPublisher.publish(queuePayload);
        this.logger.info(`Context window overflow - batched blocks for description`, { blockCount: undescribedBlocks.length, chatId });
      }
    }

    if (summaryOutboxEvent) {
      await this.summaryPublisher.publish(
        summaryOutboxEvent._id.toString(),
        messageToCompress,
        chat.summary,
      );

      this.logger.info(`Triggered memory compression`, { chatId: chat._id.toString(), outboxEventId: summaryOutboxEvent._id.toString() });
    }

    return { chat, modelMessageId };
  }
}
