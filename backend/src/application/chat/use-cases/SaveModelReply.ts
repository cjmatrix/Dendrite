import { Chat } from "../../../models/Chat";
import { Message } from "../../../models/Message";
import { CodeBlock } from "../../../models/CodeBlock";
import { OutboxEvent } from "../../../models/OutboxEvent";
import { AppError } from "../../../utils/AppError";
import { hashCode } from "../../../utils/stripComments";
import { redisConnection } from "../../../config/redis";
import mongoose from "mongoose";
import addDescriptionQueue from "../../../queue/descriptionQueue";
import addSummaryQueue from "../../../queue/summaryQueue";
import addStateQueue from "../../../queue/stateQueue";
import CONTEXT_WINDOW from "../../../constants/contextWindow";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { ICodeBlockRepository } from "../../../domain/chat/repositories/ICodeBlockRepository";
import { IOutboxEventRepository } from "../../../domain/outbox/repositories/IOutboxEventRepository";

export function extractCodeBlocks(text: string) {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: { language: string; code: string; hash: string }[] = [];

  let match;
  while ((match = regex.exec(text)) !== null) {
    const lang = (match[1] || "text").toLowerCase();
    const code = match[2].trim();

    blocks.push({
      language: lang,
      code,
      hash: hashCode(code),
    });
  }
  return blocks;
}

export class SaveModelReply {
  constructor(
    private chatRepository: IChatRepository,
    private messageRepository: IMessageRepository,
    private codeBlockRepository: ICodeBlockRepository,
    private outboxRepository: IOutboxEventRepository,
  ) {}

  async execute(chatId: string, userId: string, modelReply: string) {
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

      if (updatedChat && updatedChat.unsummarizedCount >= CONTEXT_WINDOW) {
        const recent = await this.messageRepository.findRecentByChatId(
          chatId,
          CONTEXT_WINDOW,
          { session },
        );
        messageToCompress = recent.reverse();
        console.log(
          "Message to compress /n hereee-------------------",
          messageToCompress,
        );

        // Reset the counter atomically
        await this.chatRepository.update(
          chatId,
          userId,
          { unsummarizedCount: 0 },
          { session },
        );
      }

      const codeBlocks = extractCodeBlocks(modelReply);
      let savedBlocks: any[] = [];

      if (codeBlocks.length > 0) {
        // --- DEDUPLICATION: Only process truly new code blocks ---
        const newBlockDocs: any[] = [];

        for (const block of codeBlocks) {
          const redisKey = `code_dedup:${block.hash}`;

          const cachedDesc = await redisConnection.get(redisKey);
          if (cachedDesc) {
            console.log(
              `[CodeDedup] Redis hit for hash ${block.hash.slice(0, 8)}... — skipping API calls.`,
            );
            continue;
          }

          const existingBlock = await this.codeBlockRepository.findByHash(
            block.hash,
          );
          if (existingBlock) {
            console.log(
              `[CodeDedup] DB hit for hash ${block.hash.slice(0, 8)}... — skipping API calls.`,
            );
            // Redis to avoid future DB lookups
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
      let stateOutboxEvent = null;
      if (messageToCompress.length > 0) {
        const outboxDocs = [
          {
            eventType: "CHAT_SUMMARY_CREATED",
            payload: {
              sourceId: chat._id,
              sourceType: "chat_summary",
              userId,
              content: {
                messages: messageToCompress,
              },
              metadata: { chatId },
            },
            status: "pending",
          },
          {
            eventType: "CHAT_STATE_UPDATED",
            payload: {
              sourceId: chat._id,
              sourceType: "chat_state",
              userId,
              content: {
                messages: messageToCompress,
              },
              metadata: { chatId, previousSummary: chat.summary },
            },
            status: "pending",
          },
        ];
        const savedOutbox = await this.outboxRepository.insertMany(
          outboxDocs,
          session,
        );
        summaryOutboxEvent = savedOutbox[0];
        stateOutboxEvent = savedOutbox[1];
      }

      await session.commitTransaction();

      // Batch-describe code blocks ONLY at the summarization threshold.

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
          await addDescriptionQueue(queuePayload);
          console.log(
            `🚀 Context window overflow — batched ${undescribedBlocks.length} code blocks to description-queue!`,
          );
        }
      }

      if (summaryOutboxEvent && stateOutboxEvent) {
        //Longterm retrival facts
        addSummaryQueue(summaryOutboxEvent._id.toString(), messageToCompress);

        // Middleterm recursive chunk
        addStateQueue(
          stateOutboxEvent._id.toString(),
          messageToCompress,
          chat.summary,
        );

        console.log(
          `🚀 Triggered Dual-Memory Compression for Chat ${chat._id}! Outbox IDs: ${summaryOutboxEvent._id}, ${stateOutboxEvent._id}`,
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
