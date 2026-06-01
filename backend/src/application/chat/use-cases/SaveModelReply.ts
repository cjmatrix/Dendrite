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
import { injectable, inject } from "tsyringe";
import { ISaveModelReplyUseCase } from "./interfaces";

export function extractCodeBlocks(text: string) {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: { language: string; code: string; hash: string }[] = [];

  let match;
  let filterLang = ["plantuml", "p5"];
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
  ) {}

  async execute(input: import("../dtos/chat.dto").SaveModelReplyInputDTO) {
    const { chatId, userId, modelReply, parentContext } = input;

    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    let modelMessageId: string | null = null;
    try {
      const [modelMsg] = await this.messageRepository.createMany(
        [{ chatId, userId, role: "model", content: modelReply }],
        { session },
      );
      modelMessageId = modelMsg._id.toString();

      const updatedChat = await this.chatRepository.update(
        chatId,
        userId,
        { $inc: { unsummarizedCount: 2 } },
        { session },
      );

      let messageToCompress: any[] = [];

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

          lineageChatIds.push(parentChatId.toString());
        });
      }

      if (updatedChat && totalUnCount >= CONTEXT_WINDOW) {
        const recent = await this.messageRepository.findRecentByChatId(
          chatId,
          CONTEXT_WINDOW,
          { session },
        );
        const totalRecent = [...recent, ...totalParentMessagesToCompress];
        messageToCompress = totalRecent.reverse();
        console.log(
          "Message to compress /n hereee-------------------",
          messageToCompress,
        );

        await this.chatRepository.bulkResetUnsummarizedCount(
          lineageChatIds,
          userId,
          { session },
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
            console.log(
              `[CodeDedup] Redis hit for hash ${block.hash.slice(0, 8)}  skipping API calls.`,
            );
            continue;
          }

          const existingBlock = await this.codeBlockRepository.findByHash(
            block.hash,
          );
          if (existingBlock) {
            console.log(
              `[CodeDedup] DB hit for hash ${block.hash.slice(0, 8)}   skipping API calls.`,
            );

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
            newBlockDocs,
            session,
          );
          console.log(
            `[CodeDedup] ${newBlockDocs.length} new / ${codeBlocks.length - newBlockDocs.length} duplicate blocks in this reply.`,
          );
        } else {
          console.log(
            `[CodeDedup] All ${codeBlocks.length} code block(s) were duplicates — zero API calls needed.`,
          );
        }
      }

      let summaryOutboxEvent = null;
      if (messageToCompress.length > 0) {
        const outboxDoc = {
          eventType: "CHAT_SUMMARY_CREATED",
          payload: {
            sourceId: chat._id,
            sourceType: "chat_summary",
            userId,
            content: {
              messages: messageToCompress,
            },
            metadata: { chatId, previousSummary: chat.summary },
          },
          status: "pending",
        };
        const savedOutbox = await this.outboxRepository.insertMany(
          [outboxDoc],
          session,
        );
        summaryOutboxEvent = savedOutbox[0];
      }

      await session.commitTransaction();

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
          console.log(
            `Context window overflow  batched ${undescribedBlocks.length} code blocks to description-queue!`,
          );
        }
      }

      if (summaryOutboxEvent) {
        await this.summaryPublisher.publish(
          summaryOutboxEvent._id.toString(),
          messageToCompress,
          chat.summary,
        );

        console.log(
          `Triggered Dual-Memory Compression for Chat ${chat._id} Outbox ID: ${summaryOutboxEvent._id}`,
        );
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return { chat, modelMessageId };
  }
}
