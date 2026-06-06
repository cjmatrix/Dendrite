import { Request, Response } from "express";
import multer from "multer";
import Busboy from "busboy";
import fs from "fs";
import crypto from "crypto";
import { BaseController } from "./base/BaseController";
import { AppError } from "../../utils/AppError";
import { FileUploadService } from "../../services/FileUploadService";
import { CHAT_MESSAGES } from "../constants/chatMessages";
import { logAIQuery } from "../../utils/logger";
import { getTokenInfo } from "../../utils/tokenCounter";
import { documentProgressPubSub } from "../../services/documentProgressPubSub";
import { ILogger } from "../../application/common/ports/ILogger";
import { IAIService } from "../../application/common/ports/IAIService";

import { injectable, inject, container } from "tsyringe";
import {
  ICreateChatUseCase,
  IDeleteChatUseCase,
  IGetChatByIdUseCase,
  IGetChatDocumentsUseCase,
  IGetChatMessagesUseCase,
  IGetChatsUseCase,
  IGetSubChatUseCase,
  IPrepareMessageUseCase,
  IRemoveDocumentUseCase,
  ISaveModelReplyUseCase,
  ISaveSubChatUseCase,
  IUpdateChatUseCase,
  IUploadChatImageUseCase,
  IStreamQuickChatUseCase,
  IUploadDocumentUseCase,
  IValidateChatAccessUseCase,
  IStreamAndSaveChatUseCase,
} from "../../application/chat/use-cases/interfaces";

@injectable()
export class ChatController extends BaseController {
  private readonly upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
  });

  constructor(
    @inject("ICreateChatUseCase") private createChatUseCase: ICreateChatUseCase,
    @inject("IDeleteChatUseCase") private deleteChatUseCase: IDeleteChatUseCase,
    @inject("IGetChatByIdUseCase")
    private getChatByIdUseCase: IGetChatByIdUseCase,
    @inject("IGetChatDocumentsUseCase")
    private getChatDocumentsUseCase: IGetChatDocumentsUseCase,
    @inject("IGetChatMessagesUseCase")
    private getChatMessagesUseCase: IGetChatMessagesUseCase,
    @inject("IGetChatsUseCase") private getChatsUseCase: IGetChatsUseCase,
    @inject("IGetSubChatUseCase") private getSubChatUseCase: IGetSubChatUseCase,
    @inject("IPrepareMessageUseCase")
    private prepareMessageUseCase: IPrepareMessageUseCase,
    @inject("IRemoveDocumentUseCase")
    private removeDocumentUseCase: IRemoveDocumentUseCase,
    @inject("ISaveModelReplyUseCase")
    private saveModelReplyUseCase: ISaveModelReplyUseCase,
    @inject("ISaveSubChatUseCase")
    private saveSubChatUseCase: ISaveSubChatUseCase,
    @inject("IUpdateChatUseCase") private updateChatUseCase: IUpdateChatUseCase,
    @inject("IUploadChatImageUseCase")
    private uploadChatImageUseCase: IUploadChatImageUseCase,
    @inject("IStreamQuickChatUseCase")
    private streamQuickChatUseCase: IStreamQuickChatUseCase,
    @inject("IUploadDocumentUseCase")
    private uploadDocumentUseCase: IUploadDocumentUseCase,
    @inject("IValidateChatAccessUseCase")
    private validateChatAccessUseCase: IValidateChatAccessUseCase,
    @inject("ILogger") private logger: ILogger,
    @inject("IAIService") private aiService: IAIService,
    @inject("IStreamAndSaveChatUseCase")
    private streamAndSaveChatUseCase: IStreamAndSaveChatUseCase,
  ) {
    super();
  }

  public createChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { title, folderId } = req.body;

      if (!title || typeof title !== "string") {
        throw new AppError(CHAT_MESSAGES.TITLE_REQUIRED, 400);
      }

      const data = await this.createChatUseCase.execute({
        userId,
        title,
        folderId,
      });

      this.sendSuccess(res, data, 201, CHAT_MESSAGES.CHAT_CREATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public getChats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const data = await this.getChatsUseCase.execute(userId);
      this.sendSuccess(res, data);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public getChatById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, "id");

      const data = await this.getChatByIdUseCase.execute(id, userId);
      this.sendSuccess(res, data);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public getChatMessages = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, "id");
      const cursor = this.getQueryParam(req, "cursor");
      const limit = 10;

      const result = await this.getChatMessagesUseCase.execute({
        chatId: id,
        userId,
        limit,
        cursor: cursor || null,
      });

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public updateChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, "id");
      const { title, folderId } = req.body;

      if (!title && folderId === undefined) {
        throw new AppError(
          CHAT_MESSAGES.FIELDS_REQUIRED,
          400,
        );
      }

      const data = await this.updateChatUseCase.execute({
        chatId: id,
        userId,
        title,
        folderId,
      });
      this.sendSuccess(res, data, 200, CHAT_MESSAGES.CHAT_UPDATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public deleteChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, "id");

      const data = await this.deleteChatUseCase.execute(id, userId);
      this.sendSuccess(res, data, 200, CHAT_MESSAGES.CHAT_DELETED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public sendMessage = async (req: Request, res: Response): Promise<void> => {
    const abortController = new AbortController();

      res.on("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
      this.logger.info("Client closed connection, aborting use case from res");
    }
  });

  req.on("aborted", () => {
    abortController.abort();
    this.logger.info("Client aborted request, aborting use case from req");
  });


    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, "id");
      const input = this.normalizeInput(req.body);

      const messageContext = await this.prepareMessageUseCase.execute({
        chatId,
        userId,
        userMessage: input.queryText,
      });

      const stream = this.streamAndSaveChatUseCase.execute(
        {
          ...messageContext,
          chatId,
          userId,
          originalMessage: req.body.message,
        },
        abortController.signal,
      );

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.flushHeaders();

      for await (const chunk of stream) {
        if (chunk.type === "text") {
          res.write(`data: ${JSON.stringify({ text: chunk.value })}\n\n`);
        } else if (chunk.type === "metadata") {
          res.write(
            `data: ${JSON.stringify({ type: "metadata", ...chunk.value })}\n\n`,
          );

          if (chunk.value.usage)
            logAIQuery(chunk.value.originalMessage, chunk.value.usage);
        } else if (chunk.type === "error") {
          res.write(`data: ${JSON.stringify({ text: chunk.value })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      if (!res.headersSent) res.status(500);
      res.write(
        `data: ${JSON.stringify({ text: "Error: " + error.message })}\n\n`,
      );
      res.end();
    }
  };

  public streamQuickChat = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { chatId, anchorMessageId, highlightedText, quickChatHistory } =
        req.body;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      let stream;
      try {
        stream = await this.streamQuickChatUseCase.execute({
          userId,
          chatId,
          anchorMessageId,
          highlightedText,
          quickChatHistory,
        });
      } catch (error: any) {
        if (error.statusCode === 429) {
          res.write(
            `data: ${JSON.stringify({ text: "\n\n**Quota Exhausted:** " + error.message })}\n\n`,
          );
        } else {
          res.write(
            `data: ${JSON.stringify({ text: "\n\n**System Error:** " + error.message })}\n\n`,
          );
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      let clientDisconnected = false;
      req.on("close", () => {
        clientDisconnected = true;
      });

      for await (const chunk of stream) {
        if (clientDisconnected) {
          break;
        }
        const text = chunk.text || "";
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      if (!clientDisconnected) {
        res.write("data: [DONE]\n\n");
        res.end();
      }
    } catch (error: any) {
      if (!res.headersSent) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
      }
      res.write(
        `data: ${JSON.stringify({ text: "\n\n**System Error:** " + error.message })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
    }
  };

  public getSubChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, "id");
      const subChatId = this.getQueryParam(req, "subChatId");

      if (!subChatId) {
        throw new AppError(CHAT_MESSAGES.SUBCHAT_ID_REQUIRED, 400);
      }

      const subChat = await this.getSubChatUseCase.execute(
        chatId,
        subChatId,
        userId,
      );
      this.sendSuccess(res, subChat);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public saveSubChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, "id");
      const {
        subChatId,
        anchorMessageId,
        highlightedText,
        messages,
        relativeY,
      } = req.body;

      if (!anchorMessageId) {
        throw new AppError(
          CHAT_MESSAGES.SUBCHAT_ANCHOR_REQUIRED,
          400,
        );
      }

      const subChat = await this.saveSubChatUseCase.execute({
        chatId,
        userId,
        subChatId,
        anchorMessageId,
        highlightedText,
        messages,
        relativeY,
      });

      this.sendSuccess(res, subChat, 201, CHAT_MESSAGES.SUBCHAT_SAVED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public get uploadChatImageMiddleware() {
    return this.upload.single("image");
  }

  public uploadChatImage = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const chatId = req.body.chatId;

      if (!chatId || typeof chatId !== "string") {
        throw new AppError(CHAT_MESSAGES.CHAT_ID_REQUIRED, 400);
      }

      if (!req.file) {
        throw new AppError(CHAT_MESSAGES.IMAGE_REQUIRED, 400);
      }

      if (!req.file.mimetype.startsWith("image/")) {
        throw new AppError(CHAT_MESSAGES.ONLY_IMAGES_ALLOWED, 400);
      }

      const result = await this.uploadChatImageUseCase.execute({
        userId,
        chatId,
        file: {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
        },
      });

      this.sendSuccess(res, result, 201, CHAT_MESSAGES.IMAGE_UPLOADED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public uploadChatPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, "id");

      const busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: 100 * 1024 * 1024 },
      });

      let filePath = "";
      let responseSent = false;
      let fileName = "";

      const sendJson = (status: number, payload: any) => {
        if (responseSent) return;
        responseSent = true;
        res.status(status).json(payload);
      };

      let fileProcessPromise: Promise<void> | null = null;

      busboy.on("field", (fieldname, val) => {
        if (fieldname === "fileName") {
          fileName = val;
        }
      });

      busboy.on("file", (fieldname, file, info) => {
        const { filename } = info;
        filePath = FileUploadService.generateTempFilePath(filename);

        fileProcessPromise = new Promise(async (resolve, reject) => {
          const chunks: Buffer[] = [];
          let headerLength = 0;
          const HEADER_BYTES = 4200;
          let isValidated = false;
          let writeStream: fs.WriteStream | null = null;
          let isProcessing = false;

          const validateAndStartWriting = async (finalChunks: Buffer[]) => {
            if (isProcessing || responseSent) return;
            isProcessing = true;

            try {
              const total = Buffer.concat(finalChunks);
              await FileUploadService.validateDocumentFile(total, filename);
              isValidated = true;

              writeStream = fs.createWriteStream(filePath);
              writeStream.on("error", (err) => {
                console.error("Write stream error:", err);
                if (!responseSent)
                  sendJson(500, { message: CHAT_MESSAGES.FAILED_TO_SAVE_FILE });
                reject(err);
              });

              writeStream.write(total);
              isProcessing = false;
              file.resume();
            } catch (error: any) {
              if (!responseSent)
                sendJson(error.statusCode || 415, { message: error.message });
              isProcessing = false;
              file.resume();
              reject(error);
            }
          };

          file.on("data", (chunk: Buffer) => {
            if (responseSent) return;

            if (!isValidated) {
              chunks.push(chunk);
              headerLength += chunk.length;

              if (headerLength >= HEADER_BYTES && !isProcessing) {
                file.pause();
                validateAndStartWriting(chunks).catch(reject);
              }
            } else if (writeStream) {
              writeStream.write(chunk);
            }
          });

          file.on("end", async () => {
            if (responseSent) {
              resolve();
              return;
            }

            try {
              if (!isValidated) {
                await validateAndStartWriting(chunks);
              }

              if (writeStream) {
                writeStream.end(() => resolve());
              } else {
                resolve();
              }
            } catch (err) {
              reject(err);
            }
          });

          file.on("limit", () => {
            if (!responseSent)
              sendJson(413, {
                message: CHAT_MESSAGES.FILE_TOO_LARGE,
              });
            file.resume();
            resolve();
          });
        });
      });

      busboy.on("finish", async () => {
        if (responseSent) return;

        try {
          if (fileProcessPromise) {
            await fileProcessPromise;
          }

          if (!filePath) {
            sendJson(400, { message: CHAT_MESSAGES.NO_FILE_UPLOADED });
            return;
          }

          const result = await this.uploadDocumentUseCase.execute({
            userId,
            chatId,
            filePath,
            fileName: fileName || "document",
          });

          sendJson(202, {
            success: true,
            data: result,
          });
        } catch (error: any) {
          this.logger.error("Document queue failed:", error);
          if (!responseSent) {
            const message = error.statusCode
              ? error.message
              : CHAT_MESSAGES.FAILED_TO_QUEUE;
            sendJson(error.statusCode || 500, { message });
          }
          if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });

      busboy.on("error", (error) => {
        console.error("Busboy error:", error);
        sendJson(500, { message: CHAT_MESSAGES.FAILED_TO_PROCESS });
      });

      req.pipe(busboy);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public streamDocumentProgress = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    let unsubscribe: (() => Promise<void>) | null = null;
    let heartbeat: NodeJS.Timeout | null = null;

    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, "id");
      const documentId = this.getRouteParam(req, "documentId");

      await this.validateChatAccessUseCase.execute({ chatId, userId });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const writeEvent = (eventName: string, payload: unknown) => {
        res.write(`event: ${eventName}\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      };

      writeEvent("connected", {
        documentId,
        chatId,
        status: "connected",
        timestamp: new Date().toISOString(),
      });

      const latest = await documentProgressPubSub.getLatest(documentId);
      if (latest && latest.userId === userId && latest.chatId === chatId) {
        writeEvent("progress", latest);

        if (latest.status === "completed" || latest.status === "failed") {
          writeEvent("done", latest);
          res.end();
          return;
        }
      }

      unsubscribe = await documentProgressPubSub.subscribe(
        documentId,
        (event) => {
          if (event.userId !== userId || event.chatId !== chatId) return;
          writeEvent("progress", event);

          if (event.status === "completed" || event.status === "failed") {
            writeEvent("done", event);
            if (heartbeat) clearInterval(heartbeat);
            if (unsubscribe) {
              unsubscribe().catch((error) =>
                console.error(
                  "[SSE] Failed to unsubscribe document listener:",
                  error,
                ),
              );
            }
            res.end();
          }
        },
      );

      heartbeat = setInterval(() => {
        res.write(`: ping ${Date.now()}\n\n`);
      }, 25000);

      req.on("close", async () => {
        if (heartbeat) clearInterval(heartbeat);
        if (unsubscribe) {
          try {
            await unsubscribe();
          } catch (error) {
            console.error("[SSE] Failed to unsubscribe on close:", error);
          }
        }
      });
    } catch (error) {
      if (heartbeat) clearInterval(heartbeat);
      if (unsubscribe) {
        try {
          await unsubscribe();
        } catch (unsubscribeError) {
          console.error(
            "[SSE] Failed to unsubscribe after error:",
            unsubscribeError,
          );
        }
      }

      if (res.headersSent) {
        res.write(
          `event: error\ndata: ${JSON.stringify({ message: CHAT_MESSAGES.FAILED_TO_STREAM_PROGRESS })}\n\n`,
        );
        res.end();
        return;
      }

      this.sendError(res, error);
    }
  };

  public getChatDocuments = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, "id");

      const data = await this.getChatDocumentsUseCase.execute(chatId, userId);
      this.sendSuccess(res, data);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public removeDocument = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, "id");
      const { fileUrl } = req.body;

      if (!fileUrl || typeof fileUrl !== "string") {
        throw new AppError(CHAT_MESSAGES.FILE_URL_REQUIRED, 400);
      }

      const data = await this.removeDocumentUseCase.execute({
        userId,
        chatId,
        fileUrl,
      });
      this.sendSuccess(res, data);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  private normalizeInput(body: any) {
    const { message, mode, imageUrl, fileUrl, fileName } = body;
    const normalizedMessage = typeof message === "string" ? message.trim() : "";
    const normalizedImageUrl =
      typeof imageUrl === "string" ? imageUrl.trim() : "";
    const normalizedFileUrl = typeof fileUrl === "string" ? fileUrl.trim() : "";
    const normalizedFileName =
      typeof fileName === "string" ? fileName.trim() : "";

    if (!normalizedMessage && !normalizedImageUrl && !normalizedFileUrl) {
      throw new AppError(CHAT_MESSAGES.INPUT_REQUIRED, 400);
    }

    const queryText =
      normalizedMessage ||
      (normalizedFileName
        ? `Analyze uploaded file: ${normalizedFileName}`
        : "Analyze the uploaded image");
    return {
      queryText,
      mode,
      imageUrl: normalizedImageUrl || undefined,
      fileUrl: normalizedFileUrl || undefined,
      fileName: normalizedFileName || undefined,
    };
  }

  private async streamAndSave(
    req: Request,
    res: Response,
    contents: any[],
    chatId: string,
    userId: string,
    userMessageId: string,
    parentContext: any,
    originalMessage: string,
    parentSummary: string | null,
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const abortController = new AbortController();
    let clientDisconnected = false;

    let stream: any = null;
    req.on("close", () => {
      clientDisconnected = true;
      abortController.abort();

      if (stream) {
        if (typeof stream.return === "function") {
          stream.return();
        }
        this.logger.info(
          `AI streaming network stream violently terminated for chat ${chatId}`,
        );
      }
    });

    try {
      stream = await this.aiService.streamAIContent(
        contents,
        "gemini-3-flash-preview",
        abortController.signal,
      );
    } catch (error: any) {
      res.write(
        `data: ${JSON.stringify({ text: "\n\n**Quota Exhausted:** " + CHAT_MESSAGES.QUOTA_EXHAUSTED })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    let fullReply = "";
    let finalUsageMetadata: any = null;
    res.flushHeaders();

    for await (const chunk of stream) {
      if (clientDisconnected || abortController.signal.aborted) {
        this.logger.info(`AI streaming aborted by client for chat ${chatId}`);
        break;
      }

      const text = chunk.text || "";
      fullReply += text;
      if (chunk.usageMetadata) {
        finalUsageMetadata = chunk.usageMetadata;
      }
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    if (!fullReply.trim()) {
      this.logger.error(`Empty AI response for chat ${chatId}`);
      if (!clientDisconnected) {
        res.write(
          `data: ${JSON.stringify({ text: "\n\n**Error:** " + CHAT_MESSAGES.EMPTY_AI_RESPONSE })}\n\n`,
        );
        res.write("data: [DONE]\n\n");
        res.end();
      }
      return;
    }
    if (!clientDisconnected && fullReply.trim()) {
      try {
        const { modelMessageId } = await this.saveModelReplyUseCase.execute({
          chatId,
          userId,
          modelReply: fullReply,
          parentContext,
          parentSummary,
        });

        res.write(
          `data: ${JSON.stringify({ type: "metadata", userMessageId, modelMessageId })}\n\n`,
        );
        if (finalUsageMetadata) {
          logAIQuery(originalMessage, finalUsageMetadata);
        }
      } catch (err) {
        this.logger.error("Failed to save model reply or log usage:", err);
      }
    }

    if (!clientDisconnected) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
}

export const chatController = container.resolve(ChatController);
