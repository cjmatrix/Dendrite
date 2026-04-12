import { Request, Response } from "express";
import { MongoChatRepository } from "../infrastructure/chat/repositories/MongoChatRepository";
import { MongoMessageRepository } from "../infrastructure/chat/repositories/MongoMessageRepository";
import { MongoSubChatRepository } from "../infrastructure/chat/repositories/MongoSubChatRepository";
import { MongoCodeBlockRepository } from "../infrastructure/chat/repositories/MongoCodeBlockRepository";
import { MongoOutboxEventRepository } from "../infrastructure/outbox/repositories/MongoOutboxEventRepository";

import { QdrantVectorRepository } from "../infrastructure/vector/repositories/QdrantVectorRepository";
import { CreateChat } from "../application/chat/use-cases/CreateChat";
import { GetChats } from "../application/chat/use-cases/GetChats";
import { GetChatById } from "../application/chat/use-cases/GetChatById";
import { GetChatMessages } from "../application/chat/use-cases/GetChatMessages";
import { UpdateChat } from "../application/chat/use-cases/UpdateChat";
import { DeleteChat } from "../application/chat/use-cases/DeleteChat";
import { PrepareMessage } from "../application/chat/use-cases/PrepareMessage";
import { SaveModelReply } from "../application/chat/use-cases/SaveModelReply";
import { SaveSubChat } from "../application/chat/use-cases/SaveSubChat";
import { GetSubChat as GetSubChatUseCase } from "../application/chat/use-cases/GetSubChat";
import ai, { aiInstances, getRotatedAI, rotateAIKey } from "../config/AIConfig";
import mongoose from "mongoose";
import { Chat } from "../models/Chat";
import { SubChat } from "../models/SubChat";
import { redisConnection } from "../config/redis";
import { logAIQuery } from "../utils/logger";
import { Message } from "../models/Message";
import CONTEXT_WINDOW from "../constants/contextWindow";
import { getTavilySearchContext } from "../services/searchCacheService";
import { generateEmbedding } from "../utils/embedding";
import multer from "multer";
import cloudinary from "../config/cloudinary";
import Busboy from "busboy";
import fs from "fs";
import path from "path";
import os from "os";
import fsp from "fs/promises";
import FileType from "file-type";
import { AppError } from "../utils/AppError";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

export const uploadChatImageMiddleware = upload.single("image");

const PDF_TEMP_DIR = path.join(os.tmpdir(), "dendrites-file-uploads");
if (!fs.existsSync(PDF_TEMP_DIR)) {
  fs.mkdirSync(PDF_TEMP_DIR, { recursive: true });
}

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);
const allowedDocumentMimeTypes = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
  "application/yaml",
  "text/yaml",
  "application/x-yaml",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/rtf",
]);

const allowedDocumentExtensions = new Set([
  ".pdf",
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".xml",
  ".yaml",
  ".yml",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".rtf",
  ".py",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".go",
  ".rs",
  ".php",
  ".rb",
  ".sh",
  ".sql",
  ".html",
  ".css",
]);

const uploadBufferToCloudinary = async (buffer: Buffer, mimetype: string) => {
  return await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "dendrites/chat-images",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ secure_url: result.secure_url });
      },
    );

    stream.end(buffer);
  });
};

const uploadPdfToCloudinary = async (filePath: string) => {
  return await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "dendrites/docs",
        resource_type: "raw",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ secure_url: result.secure_url });
      },
    );

    fs.createReadStream(filePath).on("error", reject).pipe(stream);
  });
};

export const uploadChatImage = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: "Image file is required" });
    return;
  }

  if (!req.file.mimetype.startsWith("image/")) {
    res.status(400).json({ message: "Only image files are allowed" });
    return;
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    res.status(500).json({ message: "Cloudinary is not configured" });
    return;
  }
   const detected = await FileType.fromBuffer(req.file.buffer);

  if (!detected || !ALLOWED_IMAGE_MIMES.has(detected.mime)) {
    res.status(415).json({
      message: "Unsupported file type. Only JPEG, PNG, GIF, WebP, and AVIF are allowed.",
    });
    return;
  }

  try {
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      detected.mime,
    );

    res.status(201).json({
      success: true,
      data: {
        url: result.secure_url,
      },
    });
  } catch (error: any) {
    console.error("Image upload failed:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
};

export const uploadChatPdf = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return res.status(500).json({ message: "Cloudinary is not configured" });
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: { fileSize: 100 * 1024 * 1024 },
  });

  let filePath = "";
  let responseSent = false;

  const sendJson = (status: number, payload: any) => {
    if (responseSent) return;
    responseSent = true;
    res.status(status).json(payload);
  };

  busboy.on("file", (_fieldname, file, info) => {
    const { filename } = info;
    const safeName = path.basename(filename || "document");
    filePath = path.join(PDF_TEMP_DIR, `${Date.now()}-${safeName}`);

    // Accumulate enough bytes for reliable detection
    const headerChunks: Buffer[] = [];
    const HEADER_BYTES = 4200;
    let headerCollected = false;
    let mimeValid: boolean | null = null; 
    let writeStream: fs.WriteStream | null = null;

    file.on("limit", () => {
      sendJson(413, { message: "File too large. Max allowed is 100MB." });
      file.resume(); 
    });

    file.on("data", async (chunk: Buffer) => {
      // Phase 1: accumulate header bytes
      if (!headerCollected) {
        headerChunks.push(chunk);
        const total = Buffer.concat(headerChunks);

        if (total.length >= HEADER_BYTES || file.readableEnded) {
          headerCollected = true;
          let detected;
          try{
             detected = await FileType.fromBuffer(total);
          }
          catch(err){
            sendJson(415, {
              message:
                "Unsupported file type. Allowed: PDF, text, markdown, csv, json, xml, yaml, office docs, and common code files.",
            });
          }
          const detectedMime = detected?.mime ?? "application/octet-stream";
          const detectedExt = detected?.ext ?? "";

          const isAllowedMime =
            allowedDocumentMimeTypes.has(detectedMime) ||
            detectedMime.startsWith("text/");
          const isAllowedByExt =
            detectedMime === "application/octet-stream" &&
            allowedDocumentExtensions.has(detectedExt);

          if (!isAllowedMime && !isAllowedByExt) {
            mimeValid = false;
            sendJson(415, {
              message:
                "Unsupported file type. Allowed: PDF, text, markdown, csv, json, xml, yaml, office docs, and common code files.",
            });
            file.resume(); 
            return;
          }

          mimeValid = true;

          // Only open writeStream after validation passes
          writeStream = fs.createWriteStream(filePath);
          writeStream.on("error", (err) => {
            console.error("Write error:", err);
            sendJson(500, { message: "Failed to save uploaded file" });
          });

          // Flush accumulated header bytes first
          writeStream.write(total);
        }

        return; 
      }

      
      if (mimeValid === true && writeStream) {
        writeStream.write(chunk);
      }
    });

    file.on("end", () => {
      
      writeStream?.end();
    });
  });

  busboy.on("finish", async () => {
    if (responseSent || !filePath) {
      if (!responseSent) sendJson(400, { message: "No file uploaded" });
      return;
    }

    try {
      const result = await uploadPdfToCloudinary(filePath);
      sendJson(201, { success: true, data: { url: result.secure_url } });
    } catch (error) {
      console.error("Document upload failed:", error);
      sendJson(500, { message: "Failed to upload file" });
    } finally {
      try {
        await fsp.unlink(filePath);
      } catch {
     
      }
    }
  });

  busboy.on("error", (error) => {
    console.error("Busboy error:", error);
    sendJson(500, { message: "Failed to process upload" });
  });

  req.pipe(busboy);
};




export const createChat = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { title, folderId } = req.body;

  const chatRepo = new MongoChatRepository();
  const createChatUseCase = new CreateChat(chatRepo);

  const data = await createChatUseCase.execute(
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

  const chatRepo = new MongoChatRepository();
  const getChatsUseCase = new GetChats(chatRepo);
  const data = await getChatsUseCase.execute(req.user._id.toString());

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

  const chatRepo = new MongoChatRepository();
  const getChatByIdUseCase = new GetChatById(chatRepo);
  const data = await getChatByIdUseCase.execute(id, req.user._id.toString());

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
  const limit = 10;

  const chatRepo = new MongoChatRepository();
  const messageRepo = new MongoMessageRepository();
  const subChatRepo = new MongoSubChatRepository();
  
  const getChatMessagesUseCase = new GetChatMessages(chatRepo, messageRepo, subChatRepo);

  const messages = await getChatMessagesUseCase.execute(
    id,
    req.user._id.toString(),
    limit,
    cursor,
  );

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

  const chatRepo = new MongoChatRepository();
  const updateChatUseCase = new UpdateChat(chatRepo);

  const data = await updateChatUseCase.execute(id, req.user._id.toString(), {
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

  const chatRepo = new MongoChatRepository();
  const deleteChatUseCase = new DeleteChat(chatRepo, new QdrantVectorRepository());

  const data = await deleteChatUseCase.execute(id, req.user._id.toString());

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
  const { message, mode, imageUrl } = req.body;

  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  const normalizedImageUrl =
    typeof imageUrl === "string" ? imageUrl.trim() : "";

  if (!normalizedMessage && !normalizedImageUrl) {
    res.status(400).json({ message: "Message or image is required" });
    return;
  }

  const queryText = normalizedMessage || "Analyze the uploaded image";

  const [codeQueryVector, descQueryVector] = await Promise.all([
    generateEmbedding(queryText, "CODE_RETRIEVAL_QUERY"),
    generateEmbedding(queryText, "RETRIEVAL_QUERY"),
  ]);

  const vectorRepo = new QdrantVectorRepository();
  const chatRepo = new MongoChatRepository();
  const messageRepo = new MongoMessageRepository();
  
  const prepareMessageUseCase = new PrepareMessage(vectorRepo, chatRepo, messageRepo);
  const { contents, userMessageId } = await prepareMessageUseCase.execute(
    id,
    req.user._id.toString(),
    normalizedMessage,
    mode,
    codeQueryVector,
    descQueryVector,
    normalizedImageUrl || undefined,
  );

  let internetContext = "";
  try {
    const routingPrompt = `Determine if the following user query requires an internet search to be answered accurately. 
  Respond ONLY with "YES" if it requires knowledge of recent events, real-time facts, current weather, news, specific web sources, or things outside typical LLM pre-training data.
  Respond ONLY with "NO" if it is a general reasoning, coding, writing, or conceptual question that can be answered without internet access.
  User query: "${queryText}"`;

    let routerResponse;
    let routerAttempts = 0;
    while (routerAttempts < aiInstances.length) {
      try {
        const activeAi = getRotatedAI();
        routerResponse = await activeAi.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: [{ role: "user", parts: [{ text: routingPrompt }] }],
        });
        break;
      } catch (error: any) {
        if (
          error.status === 429 ||
          error.message?.includes("quota") ||
          error.message?.includes("RESOURCE_EXHAUSTED")
        ) {
          rotateAIKey();
          routerAttempts++;
          continue;
        }
        throw error;
      }
    }

    const needsSearch = routerResponse?.text?.trim().toUpperCase() === "YES";

    if (needsSearch) {
      console.log(`[Router] internet search needed for query: "${queryText}"`);
      internetContext = await getTavilySearchContext(
        queryText,
        descQueryVector,
      );
    } else {
      console.log(
        `[Router] no internet search needed for query: "${queryText}"`,
      );
    }
  } catch (error) {
    console.error("Routing/Search error:", error);
  }
  console.log(internetContext)

  if (internetContext) {
    // Find the last text item in contents and append search results
    for (let i = contents.length - 1; i >= 0; i--) {
      if (contents[i].text && typeof contents[i].text === "string") {
        contents[i].text += internetContext;
        break;
      }
    }
  }

  if (normalizedImageUrl) {
    // Convert image URL to base64 for Gemini API
    const urlToBase64 = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString("base64");
      } catch (error) {
        console.error("Error converting image URL to base64:", error);
        return "";
      }
    };

    const base64Data = await urlToBase64(normalizedImageUrl);
    if (base64Data) {
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      });
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let stream;
  let attempts = 0;

  while (attempts < aiInstances.length) {
    try {
      const activeAi = getRotatedAI();
      stream = await activeAi.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents,
      });
      break;
    } catch (error: any) {
      if (
        error.status === 429 ||
        error.message?.includes("quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED")
      ) {
        rotateAIKey();
        attempts++;
        continue;
      }
      res.write(
        `data: ${JSON.stringify({ text: "\n\n**System Error:** " + error.message })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
  }

  if (!stream) {
    res.write(
      `data: ${JSON.stringify({ text: "\n\n**Quota Exhausted:** All your provided Gemini API keys have exceeded their free-tier limits. Please wait, or add a new key." })}\n\n`,
    );
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

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

  // Guard: If AI returned an empty response, don't save it
  if (!fullReply.trim()) {
    console.error(`⚠️ Empty AI response for chat ${id}`);

    res.write(
      `data: ${JSON.stringify({ text: "\n\n**Error:** The AI returned an empty response. Please try again." })}\n\n`,
    );
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  try {
    const chatRepo = new MongoChatRepository();
    const messageRepo = new MongoMessageRepository();
    const codeBlockRepo = new MongoCodeBlockRepository();
    const outboxRepo = new MongoOutboxEventRepository();

    const saveModelReplyUseCase = new SaveModelReply(chatRepo, messageRepo, codeBlockRepo, outboxRepo);
    const { modelMessageId } = await saveModelReplyUseCase.execute(
      id,
      req.user._id.toString(),
      fullReply,
    );

    res.write(
      `data: ${JSON.stringify({ type: "metadata", userMessageId, modelMessageId })}\n\n`,
    );

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
  const cacheKey = `anchor_ctx:${anchorMessageId}`;

  try {
    const cachedData = await redisConnection.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const messageRepo = new MongoMessageRepository();
    const anchorMsg = await messageRepo.findById(anchorMessageId);
    if (!anchorMsg) return [];

    const contextMessages = await messageRepo.findAnchorContext(chatId, anchorMsg.createdAt, 4);

    const result = contextMessages.reverse();

    await redisConnection.setex(cacheKey, 7200, JSON.stringify(result));

    return result;
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

  const systemPrompt = `You are a surgical AI Assistant specialized in analyzing highlights within a side-modal.
---
HISTORICAL CONTEXT (for background only):
${historicalString}

USER'S HIGHLIGHT (your primary focus):
"${highlightedText}"
---
RESPONSE GUIDELINES:
- DEFAULT: Be brief. Use crisp bullet points and short, punchy sentences in default but you can identify user need and have the flexibility to generate response.
- ONLY provide an expansive/detailed explanation if the user specifically asks to explanation in detailed manner or any other specific style according to user query".
.`;

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

  let stream;
  let attempts = 0;

  while (attempts < aiInstances.length) {
    try {
      const activeAi = getRotatedAI();
      stream = await activeAi.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents,
      });
      break;
    } catch (error: any) {
      if (
        error.status === 429 ||
        error.message?.includes("quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED")
      ) {
        rotateAIKey();
        attempts++;
        continue;
      }
      res.write(
        `data: ${JSON.stringify({ text: "\n\n**System Error:** " + error.message })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
  }

  if (!stream) {
    res.write(
      `data: ${JSON.stringify({ text: "\n\n**Quota Exhausted:** All your provided Gemini API keys have exceeded their free-tier limits. Please wait, or add a new key." })}\n\n`,
    );
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

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
    const subChatRepo = new MongoSubChatRepository();
    const getSubChatUseCase = new GetSubChatUseCase(subChatRepo);

    const subChat = await getSubChatUseCase.execute(
      chatId as string,
      subChatId as string,
      req.user._id.toString()
    );

    res.json({
      success: true,
      data: subChat,
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

  try {
    const subChatRepo = new MongoSubChatRepository();
    const saveSubChatUseCase = new SaveSubChat(subChatRepo);

    const subChat = await saveSubChatUseCase.execute(
      chatId as string,
      req.user._id.toString(),
      subChatId,
      anchorMessageId,
      highlightedText,
      messages,
      relativeY
    );

    res.json({
      success: true,
      data: subChat,
    });
  } catch (error) {
    console.error("Save SubChat Error:", error);
    res.status(500).json({ error });
  }
};
