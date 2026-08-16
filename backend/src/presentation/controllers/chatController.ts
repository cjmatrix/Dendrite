import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import crypto from "crypto";
import { BaseController } from "./base/BaseController";
import { AppError } from "../../utils/AppError";
import {
  getModelOption,
  DEFAULT_MODEL,
  getProviderKey,
  QUICK_CHAT_MODEL,
} from "../../constants/models";
import { CHAT_MESSAGES } from "../constants/chatMessages";
import { UserTier } from "../../constants/rateLimits";
import { HttpStatus } from "../constants/httpStatus";
import { logAIQuery } from "../../utils/logger";
import { getTokenInfo, estimateTokenCount } from "../../utils/tokenCounter";
import { documentProgressPubSub } from "../../services/documentProgressPubSub";
import { ILogger } from "../../application/common/ports/ILogger";
import { IAIService } from "../../application/common/ports/IAIService";
import { IRateLimitService } from "../../application/common/ports/IRateLimitService";

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
    limits: { fileSize: 50 * 1024 * 1024 },
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
    @inject("IRateLimitService") private rateLimitService: IRateLimitService,
  ) {
    super();
  }

  public createChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { title, folderId, type } = req.body;

      if (!title || typeof title !== "string") {
        throw new AppError(CHAT_MESSAGES.TITLE_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const data = await this.createChatUseCase.execute({
        userId,
        title,
        folderId,
        type,
      });

      this.sendSuccess(res, data, HttpStatus.CREATED, CHAT_MESSAGES.CHAT_CREATED);
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
      const limitParam = this.getQueryParam(req, "limit");
      const limit = limitParam ? parseInt(limitParam, 10) : 20;

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
        throw new AppError(CHAT_MESSAGES.FIELDS_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const data = await this.updateChatUseCase.execute({
        chatId: id,
        userId,
        title,
        folderId,
      });
      this.sendSuccess(res, data, HttpStatus.OK, CHAT_MESSAGES.CHAT_UPDATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public deleteChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, "id");

      const data = await this.deleteChatUseCase.execute(id, userId);
      this.sendSuccess(res, data, HttpStatus.OK, CHAT_MESSAGES.CHAT_DELETED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public sendMessage = async (req: Request, res: Response): Promise<void> => {
    const abortController = new AbortController();
    let heartbeatInterval: NodeJS.Timeout | undefined;

    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, "id");
      const input = this.normalizeInput(req.body);

      const userTier = req.user?.tier || "free";
      const requestedModel = input.model || DEFAULT_MODEL;
      const modelOption = getModelOption(requestedModel);
      if (modelOption && modelOption.tier === "paid" && userTier === "free") {
        throw new AppError(
          "Paid models from OpenRouter are locked on the Free plan. Please upgrade to Pro or Enterprise.",
          HttpStatus.FORBIDDEN
        );
      }
      if (userTier === "byok") {
        const isGemini = requestedModel.startsWith("gemini");
        if (!isGemini) {
          throw new AppError(
            "BYOK tier is restricted to Gemini models only.",
            HttpStatus.FORBIDDEN
          );
        }
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      res.write(":\n\n"); 

      heartbeatInterval = setInterval(() => {
        res.write(":\n\n");
      }, 15000);

      req.on("close", () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (!abortController.signal.aborted) {
          abortController.abort();
          this.logger.info("Client closed connection, aborting message generation");
        }
      });

      const messageContext = await this.prepareMessageUseCase.execute({
        chatId,
        userId,
        userMessage: input.queryText,
        mode: input.mode,
        model: input.model,
        imageUrl: input.imageUrl,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        editMessageId: req.body.editMessageId,
      });

      const stream = this.streamAndSaveChatUseCase.execute(
        {
          ...messageContext,
          chatId,
          userId,
          userTier: req.user?.tier,
          originalMessage: req.body.message,
        },
        abortController.signal,
      );

      for await (const chunk of stream) {
        if (chunk.type === "text") {
          res.write(`data: ${JSON.stringify({ text: chunk.value })}\n\n`);
        } else if (chunk.type === "metadata") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const metaVal = chunk.value as Record<string, any>;
          res.write(
            `data: ${JSON.stringify({ type: "metadata", ...metaVal })}\n\n`,
          );

          if (metaVal.usage)
            logAIQuery(metaVal.originalMessage, metaVal.usage);
        } else if (chunk.type === "error") {
          res.write(
            `data: ${JSON.stringify({ text: `\n\n**Error:** ${chunk.value}` })}\n\n`,
          );
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      this.logger.error("Error in sendMessage controller", error);
      
      if (res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ text: `\n\n**System Error:** ${(error as Error).message}` })}\n\n`,
        );
        res.write("data: [DONE]\n\n");
        res.end();
      } else {
        this.sendError(res, error);
      }
    } finally {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    }
  };

  public streamQuickChat = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    let heartbeatInterval: NodeJS.Timeout | undefined;
    try {
      const userId = this.validateUserAuth(req);
      const userTier = req.user?.tier || "free";
      const chatId = req.params.id as string;
      const { anchorMessageId, highlightedText, quickChatHistory, model, mode } =
        req.body;

      let modelStr = typeof model === "string" ? model.trim() : undefined;
      if (modelStr && modelStr.toUpperCase() === "DEFAULT") {
        modelStr = DEFAULT_MODEL;
      }
      const activeModel = modelStr || DEFAULT_MODEL;
      const modelOption = getModelOption(activeModel);
      if (!modelOption) {
        throw new AppError(
          CHAT_MESSAGES.INVALID_MODEL,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (modelOption.tier === "paid" && userTier === "free") {
        throw new AppError(
          "Paid models from OpenRouter are locked on the Free plan. Please upgrade to Pro or Enterprise.",
          HttpStatus.FORBIDDEN
        );
      }
      if (userTier === "byok") {
        const isGemini = activeModel.startsWith("gemini");
        if (!isGemini) {
          throw new AppError(
            "BYOK tier is restricted to Gemini models only.",
            HttpStatus.FORBIDDEN
          );
        }
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      res.write(":\n\n"); 

      heartbeatInterval = setInterval(() => {
        res.write(":\n\n");
      }, 15000);

      const abortController = new AbortController();
      let stream;
      try {
        stream = this.streamQuickChatUseCase.execute(
          {
            userId,
            chatId,
            anchorMessageId,
            highlightedText,
            quickChatHistory,
            userTier,
            model: activeModel,
            mode: mode || "general",
          },
          abortController.signal
        );
      } catch (error: unknown) {
        if ((error as { statusCode?: number }).statusCode === HttpStatus.TOO_MANY_REQUESTS) {
          res.write(
            `data: ${JSON.stringify({ text: "\n\n**Quota Exhausted:** " + (error as Error).message })}\n\n`,
          );
        } else {
          res.write(
            `data: ${JSON.stringify({ text: "\n\n**System Error:** " + (error as Error).message })}\n\n`,
          );
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      req.on("close", () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (!abortController.signal.aborted) {
          abortController.abort();
          this.logger.info("Client closed connection, aborting quick chat generation");
        }
      });

      for await (const chunk of await stream) {
        const text = chunk.text || "";
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: unknown) {
      if (!res.headersSent) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
      }
      res.write(
        `data: ${JSON.stringify({ text: "\n\n**System Error:** " + (error as Error).message })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
    } finally {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    }
  };

  public getSubChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, "id");
      const subChatId = this.getQueryParam(req, "subChatId");

      if (!subChatId) {
        throw new AppError(CHAT_MESSAGES.SUBCHAT_ID_REQUIRED, HttpStatus.BAD_REQUEST);
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
        throw new AppError(CHAT_MESSAGES.SUBCHAT_ANCHOR_REQUIRED, HttpStatus.BAD_REQUEST);
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

      this.sendSuccess(res, subChat, HttpStatus.CREATED, CHAT_MESSAGES.SUBCHAT_SAVED);
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
        throw new AppError(CHAT_MESSAGES.CHAT_ID_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      if (!req.file) {
        throw new AppError(CHAT_MESSAGES.IMAGE_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      if (!req.file.mimetype.startsWith("image/")) {
        throw new AppError(CHAT_MESSAGES.ONLY_IMAGES_ALLOWED, HttpStatus.BAD_REQUEST);
      }

      const userTier = (req.user?.tier || "free") as UserTier;
      const uploadSizeLimits = await this.rateLimitService.getUploadSizeLimits();
      const imageLimit = uploadSizeLimits[userTier]?.image ?? (2 * 1024 * 1024);

      if (req.file.size > imageLimit) {
        throw new AppError(CHAT_MESSAGES.FILE_EXCEEDS_LIMIT, HttpStatus.PAYLOAD_TOO_LARGE);
      }

      const result = await this.uploadChatImageUseCase.execute({
        userId,
        chatId,
        file: {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
        },
      });

      this.sendSuccess(res, result, HttpStatus.CREATED, CHAT_MESSAGES.IMAGE_UPLOADED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public uploadChatPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, "id");

      if (!req.file) {
        throw new AppError(CHAT_MESSAGES.NO_FILE_UPLOADED, HttpStatus.BAD_REQUEST);
      }

      const result = await this.uploadDocumentUseCase.execute({
        userId,
        chatId,
        filePath: req.file.path,
        fileName: req.file.originalname,
      });

      this.sendSuccess(res, result, HttpStatus.ACCEPTED);
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
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
        throw new AppError(CHAT_MESSAGES.FILE_URL_REQUIRED, HttpStatus.BAD_REQUEST);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeInput(body: any) {
    const { message, mode, model, imageUrl, fileUrl, fileName } = body;
    const normalizedMessage = typeof message === "string" ? message.trim() : "";
    const normalizedImageUrl =
      typeof imageUrl === "string" ? imageUrl.trim() : "";
    const normalizedFileUrl = typeof fileUrl === "string" ? fileUrl.trim() : "";
    const normalizedFileName =
      typeof fileName === "string" ? fileName.trim() : "";

    if (!normalizedMessage && !normalizedImageUrl && !normalizedFileUrl) {
      throw new AppError(CHAT_MESSAGES.INPUT_REQUIRED, HttpStatus.BAD_REQUEST);
    }

    const queryText =
      normalizedMessage ||
      (normalizedFileName
        ? `Analyze uploaded file: ${normalizedFileName}`
        : "Analyze the uploaded image");
    let modelStr = typeof model === "string" ? model.trim() : undefined;
    if (modelStr && modelStr.toUpperCase() === "DEFAULT") {
      modelStr = DEFAULT_MODEL;
    }
    if (modelStr && !getModelOption(modelStr)) {
      throw new AppError(
        CHAT_MESSAGES.INVALID_MODEL,
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      queryText,
      mode,
      model: modelStr,
      imageUrl: normalizedImageUrl || undefined,
      fileUrl: normalizedFileUrl || undefined,
      fileName: normalizedFileName || undefined,
    };
  }

  // private async streamAndSave(
  //   req: Request,
  //   res: Response,
  //   contents: any[],
  //   chatId: string,
  //   userId: string,
  //   userMessageId: string,
  //   parentContext: any,
  //   originalMessage: string,
  //   parentSummary: string | null,
  // ) {
  //   res.setHeader("Content-Type", "text/event-stream");
  //   res.setHeader("Cache-Control", "no-cache");
  //   res.setHeader("Connection", "keep-alive");

  //   const abortController = new AbortController();
  //   let clientDisconnected = false;

  //   let stream: any = null;
  //   req.on("close", () => {
  //     clientDisconnected = true;
  //     abortController.abort();

  //     if (stream) {
  //       if (typeof stream.return === "function") {
  //         stream.return();
  //       }
  //       this.logger.info(
  //         `AI streaming network stream violently terminated for chat ${chatId}`,
  //       );
  //     }
  //   });

  //   try {
  //     stream = await this.aiService.streamAIContent(
  //       contents,
  //       "gemini-3-flash-preview",
  //       abortController.signal,
  //     );
  //   } catch (error: unknown) {
  //     res.write(
  //       `data: ${JSON.stringify({ text: "\n\n**Quota Exhausted:** " + CHAT_MESSAGES.QUOTA_EXHAUSTED })}\n\n`,
  //     );
  //     res.write("data: [DONE]\n\n");
  //     res.end();
  //     return;
  //   }

  //   let fullReply = "";
  //   let finalUsageMetadata: any = null;
  //   res.flushHeaders();

  //   for await (const chunk of stream) {
  //     if (clientDisconnected || abortController.signal.aborted) {
  //       this.logger.info(`AI streaming aborted by client for chat ${chatId}`);
  //       break;
  //     }

  //     const text = chunk.text || "";
  //     fullReply += text;
  //     if (chunk.usageMetadata) {
  //       finalUsageMetadata = chunk.usageMetadata;
  //     }
  //     res.write(`data: ${JSON.stringify({ text })}\n\n`);
  //   }

  //   if (!fullReply.trim()) {
  //     this.logger.error(`Empty AI response for chat ${chatId}`);
  //     if (!clientDisconnected) {
  //       res.write(
  //         `data: ${JSON.stringify({ text: "\n\n**Error:** " + CHAT_MESSAGES.EMPTY_AI_RESPONSE })}\n\n`,
  //       );
  //       res.write("data: [DONE]\n\n");
  //       res.end();
  //     }
  //     return;
  //   }
  //   if (!clientDisconnected && fullReply.trim()) {
  //     try {
  //       const { modelMessageId } = await this.saveModelReplyUseCase.execute({
  //         chatId,
  //         userId,
  //         modelReply: fullReply,
  //         parentContext,
  //         parentSummary,
  //       });

  //       res.write(
  //         `data: ${JSON.stringify({ type: "metadata", userMessageId, modelMessageId })}\n\n`,
  //       );
  //       if (finalUsageMetadata) {
  //         logAIQuery(originalMessage, finalUsageMetadata);
  //       }
  //     } catch (err) {
  //       this.logger.error("Failed to save model reply or log usage:", err);
  //     }
  //   }

  //   if (!clientDisconnected) {
  //     res.write("data: [DONE]\n\n");
  //     res.end();
  //   }
  // }
}

export const chatController = container.resolve(ChatController);
