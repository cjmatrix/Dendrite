import { Chat } from "../models/Chat";
import { Message } from "../models/Message";
import { SubChat } from "../models/SubChat";
import { AppError } from "../utils/AppError";
import ai, { systemInstruction } from "../config/AIConfig";
import { CodeBlock } from "../models/CodeBlock";
import { OutboxEvent } from "../models/OutboxEvent";
import embeddingCodeDesc from "../queue/embeddingQueue";
import addDescriptionQueue from "../queue/descriptionQueue";
import mongoose from "mongoose";
import { searchSimilarCode, searchSimiliarChatChunk } from "./qdrantService";
import generateCodeDescription from "../utils/AIDescription";
import { generateEmbedding } from "../utils/embedding";
import CONTEXT_WINDOW from "../constants/contextWindow";
import addSummaryQueue from "../queue/summaryQueue";

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

export const getChatMessagesService = async (
  chatId: string,
  limit: number,
  cursor: string | null,
) => {
  const query: any = { chatId };
  
  if (cursor) {
    query._id = { $lt: cursor };
  }


  const messages = await Message.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .lean();

 
  const messageIds = messages.map(m => m._id);
  const subChats = await SubChat.find({ 
    anchorMessageId: { $in: messageIds },
    chatId: new mongoose.Types.ObjectId(chatId)
  }).select('anchorMessageId relativeY').lean();

  const subChatMap = new Map(subChats.map(sc => [sc.anchorMessageId.toString(),{relY: sc.relativeY,subChatId:sc._id}]));

  const messagesWithFlags = messages.map(m => {
    const subMap = subChatMap.get(m._id.toString());
    return {
      ...m,
      hasSubChat: subMap?.relY !== undefined,
      subChatY: subMap?.relY ?? 0,
      subChatId:subMap?.subChatId
    };
  });

  messagesWithFlags.reverse();

  return messagesWithFlags;
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

export const prepareMessageService = async (
  chatId: string,
  userId: string,
  userMessage: string,
  mode?: string,
) => {
  const chat = await Chat.findOne({ _id: chatId, userId });

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  await Message.create({ chatId, userId, role: "user", content: userMessage });

  const recentMessages = await Message.find({ chatId })
    .sort({ createdAt: -1 })
    .limit(CONTEXT_WINDOW)
    .lean();
  recentMessages.reverse();

  const recentMessagesText = recentMessages.map((m) => m.content).join("\n");

  const [codeQueryVector, descQueryVector] = await Promise.all([
    generateEmbedding(userMessage, "CODE_RETRIEVAL_QUERY"),
    generateEmbedding(userMessage, "RETRIEVAL_QUERY"),
  ]);

  const [rawSimilarCode, chatContextStats] = await Promise.all([
    searchSimilarCode(codeQueryVector, descQueryVector, userId, chatId),
    searchSimiliarChatChunk(descQueryVector, userId, chatId),
  ]);
  console.log(chatContextStats);
  const deduplicatedSimilarCode = rawSimilarCode.filter((item) => {
    return (
      typeof item.content !== "string" &&
      item.content?.code &&
      !recentMessagesText.includes(item.content.code)
    );
  });

  const deduplicatedChatContext = chatContextStats.filter((item) => {
    return item.fact?.fact && !recentMessagesText.includes(item.fact.fact);
  });

  let dynamicSystemInstruction = systemInstruction;

  if (deduplicatedSimilarCode.length > 0) {
    const contextText = deduplicatedSimilarCode
      .map(
        (item, index) =>
          `[Snippet ${index + 1} - ${item.language}]\n\`\`\`${item.language}\n${item.content.code}\n\`\`\`\nDescription: ${item.content.description}`,
      )
      .join("\n\n");

    dynamicSystemInstruction += `\n\nHere is some context from the user's previously written code that may be relevant to their query. Use it if applicable:\n\n${contextText}`;
  }

  if (deduplicatedChatContext.length > 0) {
    const factText = deduplicatedChatContext
      .map((item, index) => `[Fact ${index + 1}]: ${item.fact.fact}`)
      .join("\n\n");

    dynamicSystemInstruction += `\n\nHere are some relevant facts from the user's previous chats:\n\n${factText}`;
  }

  if (mode === "visual") {
    dynamicSystemInstruction += `\n\nCRITICAL INSTRUCTION: The user has explicitly selected "Visual Mode". 
- If the user asks to CREATE, EDIT, or MODIFY a visualization, you MUST output the raw valid JS code inside a single \`\`\`p5\`\`\` fenced code block, with NO explanations.
- If the user asks a FOLLOW-UP question, asks for an EXPLANATION, or discusses the behavior of the current visual, you MUST answer politely with normal conversational text and explanations, and DO NOT output a \`\`\`p5\`\`\` block unless they explicitly ask for a code change.

Assume your code will be executed in a blank environment. You should write standard global p5 code (e.g., function setup() { createCanvas(600, 400); } function draw() { ... }).
CRUCIAL: You MUST include a functional Pause/Resume button in your sketch. You can use p5's \`createButton()\` or draw it manually using \`rect()\`. IF you use \`createButton()\`, you MUST explicitly call \`.position(x, y)\` (e.g., \`button.position(10, 10)\`) to place it safely over the canvas, otherwise it will corrupt the HTML flex layout and overlap elements! The button MUST successfully toggle between \`noLoop()\` to pause and \`loop()\` to resume the animation. Make everything interactive and look beautiful using modern colors!`;
  }

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
    const lang = (match[1] || "text").toLowerCase();

    blocks.push({
      language: lang,
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
    await Message.create(
      [{ chatId, userId, role: "model", content: modelReply }],
      { session },
    );

    let messageToCompress: any[] = [];
    const messageCount = await Message.countDocuments({ chatId }).session(
      session,
    );

    if (messageCount > 0 && messageCount % CONTEXT_WINDOW === 0) {
      const recent = await Message.find({ chatId })
        .sort({ createdAt: -1 })
        .limit(CONTEXT_WINDOW)
        .session(session)
        .lean();
      messageToCompress = recent.reverse();
    }

    const codeBlocks = extractCodeBlocks(modelReply);
    let savedBlocks: any[] = [];

    if (codeBlocks.length > 0) {
      const docs = codeBlocks.map((block) => ({
        userId,
        chatId,
        code: block.code,
        language: block.language,
        description: "",
      }));
      savedBlocks = await CodeBlock.insertMany(docs, { session });
    }

    let summaryOutboxEvent = null;
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
      ];
      const savedOutbox = await OutboxEvent.insertMany(outboxDocs, { session });
      summaryOutboxEvent = savedOutbox[0];
    }

    await session.commitTransaction();

    if (savedBlocks.length > 0) {
      const queuePayload = savedBlocks.map((b) => ({
        _id: b._id,
        userId: b.userId,
        chatId: b.chatId,
        code: b.code,
        language: b.language,
      }));
      await addDescriptionQueue(queuePayload);
      console.log(
        `🚀 Sent ${codeBlocks.length} code blocks to description-queue background worker!`,
      );
    }

    if (summaryOutboxEvent) {
      addSummaryQueue(summaryOutboxEvent._id.toString(), messageToCompress);

      console.log(
        `🚀 Triggered Semantic Compression for Chat ${chat._id}! Outbox ID: ${summaryOutboxEvent._id}`,
      );
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return chat;
};
