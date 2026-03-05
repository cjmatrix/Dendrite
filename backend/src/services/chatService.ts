import { Chat } from "../models/Chat";
import { AppError } from "../utils/AppError";
import ai, { systemInstruction } from "../config/AIConfig";
import { CodeBlock } from "../models/CodeBlock";
import { OutboxEvent } from "../models/OutboxEvent";
import embeddingCodeDesc from "../queue/embeddingQueue";
import mongoose from "mongoose";

export const createChatService = async (
  userId: string,
  title: string,
  folderId: string | null,
) => {
  const chat = await Chat.findOne({ userId, title, folderId });
  if (chat) {
    throw new AppError(
      "Chat with this title already exists in this folder",
      400,
    );
  }

  const newChat = await Chat.create({ userId, title, folderId });
  return newChat;
};

export const getChatsService = async (userId: string) => {
  const chats = await Chat.find({ userId })
    .select("-messages")
    .sort({ createdAt: 1 })
    .lean();

  return chats;
};

export const getChatByIdService = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({ _id: chatId, userId }).lean();

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  return chat;
};

export const updateChatService = async (
  chatId: string,
  userId: string,
  updates: { title?: string; folderId?: string | null },
) => {
  const chat = await Chat.findOneAndUpdate({ _id: chatId, userId }, updates, {
    new: true,
  });

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  return chat;
};

export const deleteChatService = async (chatId: string, userId: string) => {
  const chat = await Chat.findOneAndDelete({ _id: chatId, userId });

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  return { deleted: true };
};

import { searchSimilarCode } from "./qdrantService";

export const prepareMessageService = async (
  chatId: string,
  userId: string,
  userMessage: string,
) => {
  const chat = await Chat.findOne({ _id: chatId, userId });

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  chat.messages.push({ role: "user", content: userMessage });
  await chat.save();

  
  const similarCode = await searchSimilarCode(userMessage, userId, chatId);

  let dynamicSystemInstruction = systemInstruction;
  if (similarCode.length > 0) {
    const contextText = similarCode
      .map(
        (item, index) =>
          `[Snippet ${index + 1} - ${item.language}]\n\`\`\`${item.language}\n${item.content}\n\`\`\``,
      )
      .join("\n\n");

    dynamicSystemInstruction += `\n\nHere is some context from the user's previously written code that may be relevant to their query. Use it if applicable:\n\n${contextText}`;
  }

  const recentMessages = chat.messages.slice(-1);

  const contents = [
    {
      role: "user",
      parts: [{ text: dynamicSystemInstruction }],
    },
    ...recentMessages.map((msg) => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
  ];

  return { chat, contents };
};

export function extractCodeBlocks(text: string) {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: { language: string; code: string }[] = [];

  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
    });
  }
  return blocks;
}

export const saveModelReply = async (
  chatId: string,
  userId: string,
  modelReply: string,
) => {
  const chat = await Chat.findOne({ _id: chatId, userId });

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    chat.messages.push({ role: "model", content: modelReply });
    await chat.save({ session });

    const codeBlocks = extractCodeBlocks(modelReply);
    const docs = codeBlocks.map((block) => ({
      userId,
      chatId,
      code: block.code,
      language: block.language,
    }));

    const savedBlocks = await CodeBlock.insertMany(docs, { session });

    const outboxEvents = await OutboxEvent.insertMany(
      savedBlocks.map((block) => ({
        eventType: "CODE_BLOCK_CREATED",
        payload: {
          sourceId: block._id,
          sourceType: "code_block",
          userId,
          content: block.code,
          metadata: { language: block.language, chatId },
        },
        status: "pending",
      })),
      { session },
    );

    await session.commitTransaction();

    for (const event of outboxEvents) {
      await embeddingCodeDesc(event, event.payload.content);
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return chat;
};
