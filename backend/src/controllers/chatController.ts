import { Request, Response } from "express";
import {
  createChatService,
  getChatsService,
  getChatByIdService,
  getChatMessagesService,
  updateChatService,
  deleteChatService,
  prepareMessageService,
  saveModelReply,
} from "../services/chatService";
import ai from "../config/AIConfig";
import mongoose from "mongoose";
import { Chat } from "../models/Chat";
import { SubChat } from "../models/SubChat";
import { logAIQuery } from "../utils/logger";
import { Message } from "../models/Message";
import CONTEXT_WINDOW from "../constants/contextWindow";

export const createChat = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { title, folderId } = req.body;

  const data = await createChatService(
    req.user._id.toString(),
    title,
    folderId,
  );

  res.status(201).json({
    success: true,
    data,
  });
};

export const getChats = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const data = await getChatsService(req.user._id.toString());

  res.status(200).json({
    success: true,
    data,
  });
};

export const getChatById = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = req.params.id as string;

  const data = await getChatByIdService(id, req.user._id.toString());

  res.status(200).json({
    success: true,
    data,
  });
};

export const getChatMessages = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = req.params.id as string;
  const cursor = (req.query.cursor as string) || null;
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const messages = await getChatMessagesService(id, limit, cursor);

  // Next cursor is the ID of the oldest message returned, or null if there are no more
  const nextCursor =
    messages.length === limit ? messages[0]._id.toString() : null;

  res.status(200).json({
    success: true,
    data: {
      messages,
      nextCursor,
    },
  });
};

export const updateChat = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = req.params.id as string;
  const { title, folderId } = req.body;

  const data = await updateChatService(id, req.user._id.toString(), {
    title,
    folderId,
  });

  res.status(200).json({
    success: true,
    data,
  });
};

export const deleteChat = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = req.params.id as string;

  const data = await deleteChatService(id, req.user._id.toString());

  res.status(200).json({
    success: true,
    data,
  });
};

export const sendMessage = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const id = req.params.id as string;
  const { message, mode } = req.body;

  if (!message || !message.trim()) {
    res.status(400).json({ message: "Message is required" });
    return;
  }

  const { contents } = await prepareMessageService(
    id,
    req.user._id.toString(),
    message,
    mode,
  );

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents,
  });

  let fullReply = "";
  let finalUsageMetadata: any = null;
  res.flushHeaders();

  for await (const chunk of stream) {
    const text = chunk.text || "";
    fullReply += text;
    if (chunk.usageMetadata) {
      finalUsageMetadata = chunk.usageMetadata;
    }
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }

  try {
    await saveModelReply(id, req.user._id.toString(), fullReply);

    // Log token usage if we captured it
    if (finalUsageMetadata) {
      logAIQuery(message, finalUsageMetadata);
    }
  } catch (err) {
    console.error("Failed to save model reply or log usage:", err);
  }

  res.write("data: [DONE]\n\n");
  res.end();
};

const getAnchorContext = async (chatId: string, anchorMessageId: string) => {
  try {
    const anchorMsg = await Message.findById(anchorMessageId);
    if (!anchorMsg) return [];

    const contextMessages = await Message.find({
      chatId,
      createdAt: { $lte: anchorMsg.createdAt },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return contextMessages.reverse();
  } catch (err) {
    console.error("getAnchorContext error:", err);
    return [];
  }
};

export const streamQuickChat = async (req: Request, res: Response) => {
  const { chatId, anchorMessageId, highlightedText, quickChatHistory } =
    req.body;
 
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const recentHistory = (quickChatHistory || []).slice(-CONTEXT_WINDOW);


  const backgroundContext = await getAnchorContext(chatId, anchorMessageId);
 
  const historicalString = backgroundContext
    .map((msg: any) => `[${msg.role}]: ${msg.content}`)
    .join("\n\n");

  
  const systemPrompt = `You are an in-line AI Assistant analyzing a specific highlight from an ongoing conversation.

--- HISTORICAL CONVERSATION CONTEXT ---
The following 10 messages took place right before the user highlighted the text. Use this to understand the topic:
${historicalString}

--- THE USER'S HIGHLIGHT ---
The user highlighted this exact text from the final message above:
"${highlightedText}"

Your ONLY job is to participate in a side-conversation explaining or expanding on that specific highlighted text. DO NOT answer questions irrelevant to the highlight. Remember that your conversation is a temporary pop-up modal, keep answers somewhat direct.`;

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...recentHistory.map((msg: any) => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
  ];

  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash-lite",
    contents,
  });

  for await (const chunk of stream) {
    const text = chunk.text || "";
    if (text) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }

  res.write("data: [DONE]\n\n");
  res.end();
};

export const getSubChat = async (req: Request, res: Response) => {
  const { id: chatId } = req.params;

  const { subChatId } = req.query;

  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const subChat = await SubChat.findOne({
      chatId,
      _id: subChatId,
      userId: req.user._id,
    }).lean();

    res.json({
      success: true,
      data: subChat || null,
    });
  } catch (error) {
    console.error("Get SubChat Error:", error);
    res.status(500).json({ error: "Failed to fetch sub-chat history." });
  }
};

export const saveSubChat = async (req: Request, res: Response) => {
  const { id: chatId } = req.params;
  const { subChatId, anchorMessageId, highlightedText, messages, relativeY } =
    req.body;

  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const sanitizedMessages = messages.map((msg: any) => {
    if (msg._id && typeof msg._id === "string" && msg._id.startsWith("temp-")) {
      const { _id, ...cleanMessage } = msg;
      return cleanMessage;
    }
    return msg;
  });
  console.log(subChatId   )
  try {
    let subChat;
    if (subChatId) {
      subChat = await SubChat.findOneAndUpdate(
        { _id: subChatId, userId: req.user._id },
        {
          highlightedText,
          messages: sanitizedMessages,
          relativeY,
        },
        { new: true },
      );
    } else {
      console.log("heyyyyy")
      subChat = await SubChat.create({
        chatId,
        anchorMessageId,
        userId: req.user._id,
        highlightedText,
        messages: sanitizedMessages,
        relativeY,
      });
    }

    res.json({
      success: true,
      data: subChat,
    });
  } catch (error) {
    console.error("Save SubChat Error:", error);
    res.status(500).json({error});
  }
};
