import { Request, Response } from 'express';
import multer from 'multer';
import Busboy from 'busboy';
import fs from 'fs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { BaseController } from './base/BaseController';
import { DIContainer } from './container/DIContainer';
import { AppError } from '../utils/AppError';
import { FileUploadService } from '../services/FileUploadService';
import { AIService } from '../services/AIService';
import { embeddingService } from '../services/EmbeddingService';
import { logAIQuery } from '../utils/logger';
import { documentChunkingQueue } from '../queue/documentChunkingQueue';
import { OutboxEvent } from '../models/OutboxEvent';
import CONTEXT_WINDOW from '../constants/contextWindow';

export class ChatController extends BaseController {
  private readonly upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
  });

  constructor() {
    super();
  }

  /**
   * Middleware for uploading chat images
   */
  public get uploadChatImageMiddleware() {
    return this.upload.single('image');
  }

  /**
   * Upload a chat image to Cloudinary
   * POST /api/chats/upload/image
   */
  public uploadChatImage = async (req: Request, res: Response): Promise<void> => {
    try {
      this.validateUserAuth(req);

      if (!req.file) {
        throw new AppError('Image file is required', 400);
      }

      if (!req.file.mimetype.startsWith('image/')) {
        throw new AppError('Only image files are allowed', 400);
      }

      FileUploadService.validateCloudinaryConfig();

      await FileUploadService.validateImageFile(req.file.buffer);

      const result = await FileUploadService.uploadImageToCloudinary(
        req.file.buffer,
        req.file.mimetype,
      );

      this.sendSuccess(res, { url: result.secure_url }, 201, 'Image uploaded successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

  /**
   * Upload a chat PDF/document to Cloudinary
   * POST /api/chats/upload/pdf
   */
  public uploadChatPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      this.validateUserAuth(req);
      
      FileUploadService.validateCloudinaryConfig();

      const busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: 100 * 1024 * 1024 },
      });

      let filePath = '';
      let responseSent = false;
      let chatId = '';
      let fileName = '';

      const sendJson = (status: number, payload: any) => {
        if (responseSent) return;
        responseSent = true;
        res.status(status).json(payload);
      };

      let fileProcessPromise: Promise<void> | null = null;

      // Capture form fields (chatId, fileName)
      busboy.on('field', (fieldname, val) => {
        if (fieldname === 'chatId') {
          chatId = val;
        } else if (fieldname === 'fileName') {
          fileName = val;
        }
      });

      busboy.on('file', (fieldname, file, info) => {
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
              writeStream.on('error', (err) => {
                console.error('Write stream error:', err);
                if (!responseSent) sendJson(500, { message: 'Failed to save uploaded file' });
                reject(err);
              });

              writeStream.write(total);
              isProcessing = false;
              file.resume();
            } catch (error: any) {
              if (!responseSent) sendJson(error.statusCode || 415, { message: error.message });
              isProcessing = false;
              file.resume();
              reject(error);
            }
          };

          file.on('data', (chunk: Buffer) => {
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

          file.on('end', async () => {
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

          file.on('limit', () => {
            if (!responseSent) sendJson(413, { message: 'File too large. Max allowed is 100MB.' });
            file.resume();
            resolve();
          });
        });
      });

      busboy.on('finish', async () => {
        if (responseSent) return;
        
        try {
          if (fileProcessPromise) {
            await fileProcessPromise;
          }

          if (!filePath) {
            sendJson(400, { message: 'No file uploaded' });
            return;
          }

          const result = await FileUploadService.uploadDocumentToCloudinary(filePath);
          
          // Get user info - use captured form field variables
          const userId = (req as any).user?._id;

          if (!userId) {
            sendJson(401, { message: 'User not authenticated' });
            return;
          }

          if (!chatId) {
            sendJson(400, { message: 'Chat ID is required' });
            return;
          }

         
          const documentFileName = fileName || 'document';

          // Create outbox event in MongoDB
          const outboxEvent = await OutboxEvent.create({
            eventType: 'PDF_CHUNK_CREATED',
            payload: {
              sourceId: new mongoose.Types.ObjectId(), // Document ID placeholder
              sourceType: 'pdf_chunk',
              userId: new mongoose.Types.ObjectId(userId),
              content: { fileName: documentFileName, uploadUrl: result.secure_url },
              metadata: { chatId, fileSize: 0 },
            },
            status: 'pending',
          });

          // Queue document chunking with outbox ID
          await documentChunkingQueue.add(
            'chunk-document',
            {
              outboxId: outboxEvent._id.toString(),
              filePath,
              userId,
              chatId,
              fileName: documentFileName,
            },
            {
              priority: 10,
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
            }
          );

          console.log(`📎 Queued document chunking for: ${documentFileName} (outboxId: ${outboxEvent._id})`);
          sendJson(201, { success: true, data: { url: result.secure_url } });
         
        } catch (error: any) {
          console.error('Document upload failed:', error);
          if (!responseSent) {
            const message = error.statusCode ? error.message : 'Failed to upload file To Cloudinary';
            sendJson(error.statusCode || 500, { message });
          }
          // Clean up temp file on error
          if (filePath) await FileUploadService.cleanupTempFile(filePath);
        }
      });

      busboy.on('error', (error) => {
        console.error('Busboy error:', error);
        sendJson(500, { message: 'Failed to process upload' });
      });

      req.pipe(busboy);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  /**
     Create a new chat
     POST /api/chats
   */
  public createChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { title, folderId } = req.body;

      if (!title || typeof title !== 'string') {
        throw new AppError('Chat title is required and must be a string', 400);
      }

      const createChatUseCase = DIContainer.getCreateChatUseCase();
      const data = await createChatUseCase.execute(userId, title, folderId);

      this.sendSuccess(res, data, 201, 'Chat created successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

  /**
   * Get all chats for the authenticated user
   * GET /api/chats
   */
  public getChats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const getChatsUseCase = DIContainer.getGetChatsUseCase();
      const data = await getChatsUseCase.execute(userId);

      this.sendSuccess(res, data);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  /**
   * Get a specific chat by ID
   * GET /api/chats/:id
   */
  public getChatById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');

      const getChatByIdUseCase = DIContainer.getGetChatByIdUseCase();
      const data = await getChatByIdUseCase.execute(id, userId);

      this.sendSuccess(res, data);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  /**
   * Get messages for a specific chat
   * GET /api/chats/:id/messages
   */
  public getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');
      const cursor = this.getQueryParam(req, 'cursor');
      const limit = 10;

      const getChatMessagesUseCase = DIContainer.getGetChatMessagesUseCase();
      const messages = await getChatMessagesUseCase.execute(id, userId, limit, cursor || null);

      const nextCursor = messages.length === limit ? messages[0]._id.toString() : null;

      this.sendSuccess(res, { messages, nextCursor });
    } catch (error) {
      this.sendError(res, error);
    }
  };

  /**
   * Update a chat
   * PATCH /api/chats/:id
   */
  public updateChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');
      const { title, folderId } = req.body;

      if (!title && folderId === undefined) {
        throw new AppError('At least one field (title or folderId) is required', 400);
      }

      const updateChatUseCase = DIContainer.getUpdateChatUseCase();
      const data = await updateChatUseCase.execute(id, userId, { title, folderId });

      this.sendSuccess(res, data, 200, 'Chat updated successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

  /**
   * Delete a chat
   * DELETE /api/chats/:id
   */
  public deleteChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');

      const deleteChatUseCase = DIContainer.getDeleteChatUseCase();
      const data = await deleteChatUseCase.execute(id, userId);

      this.sendSuccess(res, data, 200, 'Chat deleted successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

  /**
   * Send a message and get AI streaming response
   * POST /api/chats/:id/send-message
   */
  public sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');
      const { message, mode, imageUrl, fileUrl, fileName } = req.body;

      const normalizedMessage = typeof message === 'string' ? message.trim() : '';
      const normalizedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
      const normalizedFileUrl = typeof fileUrl === 'string' ? fileUrl.trim() : '';
      const normalizedFileName = typeof fileName === 'string' ? fileName.trim() : '';

      if (!normalizedMessage && !normalizedImageUrl && !normalizedFileUrl) {
        throw new AppError('Message, image, or file is required', 400);
      }

      const queryText = normalizedMessage || (normalizedFileName ? `Analyze uploaded file: ${normalizedFileName}` : 'Analyze the uploaded image');

      // Generate embeddings for retrieval
      const [codeQueryVector, descQueryVector] = await Promise.all([
        embeddingService.embed(queryText, 'CODE_RETRIEVAL_QUERY'),
        embeddingService.embed(queryText, 'RETRIEVAL_QUERY'),
      ]);

      // Prepare message and get context
      const prepareMessageUseCase = DIContainer.getPrepareMessageUseCase();
      const { contents, userMessageId } = await prepareMessageUseCase.execute(
        id,
        userId,
        normalizedMessage,
        mode,
        codeQueryVector,
        descQueryVector,
        normalizedImageUrl || undefined,
        normalizedFileUrl || undefined,
        normalizedFileName || undefined,
      );

      // Get internet context if needed
      let internetContext = await AIService.getInternetContext(queryText, descQueryVector);

      if (internetContext) {
        for (let i = contents.length - 1; i >= 0; i--) {
          if (contents[i].text && typeof contents[i].text === 'string') {
            contents[i].text += internetContext;
            break;
          }
        }
      }

      // Add image if provided
      if (normalizedImageUrl) {
        const base64Data = await AIService.urlToBase64(normalizedImageUrl);
        if (base64Data) {
          contents.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          });
        }
      }

      // Set up streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let stream;
      try {
        stream = await AIService.streamAIContent(contents);
      } catch (error: any) {
        res.write(
          `data: ${JSON.stringify({ text: '\n\n**Quota Exhausted:** All your provided Gemini API keys have exceeded their free-tier limits. Please wait, or add a new key.' })}\n\n`,
        );
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      let fullReply = '';
      let finalUsageMetadata: any = null;
      res.flushHeaders();

      for await (const chunk of stream) {
        const text = chunk.text || '';
        fullReply += text;
        if (chunk.usageMetadata) {
          finalUsageMetadata = chunk.usageMetadata;
        }
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      // Guard: empty response
      if (!fullReply.trim()) {
        console.error(`⚠️ Empty AI response for chat ${id}`);
        res.write(
          `data: ${JSON.stringify({ text: '\n\n**Error:** The AI returned an empty response. Please try again.' })}\n\n`,
        );
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      // Save the model reply
      try {
        const saveModelReplyUseCase = DIContainer.getSaveModelReplyUseCase();
        const { modelMessageId } = await saveModelReplyUseCase.execute(
          id,
          userId,
          fullReply,
        );

        res.write(
          `data: ${JSON.stringify({ type: 'metadata', userMessageId, modelMessageId })}\n\n`,
        );

        if (finalUsageMetadata) {
          logAIQuery(message, finalUsageMetadata);
        }
      } catch (err) {
        console.error('Failed to save model reply or log usage:', err);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
      }
      res.write(
        `data: ${JSON.stringify({ text: '\n\n**System Error:** ' + error.message })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
    }
  };

  /**
   * Stream quick chat response for highlighted text
   * POST /api/chats/:id/quick-chat
   */
  public streamQuickChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { chatId, anchorMessageId, highlightedText, quickChatHistory } = req.body;

      // if (!highlightedText || !anchorMessageId) {
      //   throw new AppError('Highlighted text and anchor message ID are required', 400);
      // }

      const recentHistory = (quickChatHistory || []).slice(-CONTEXT_WINDOW);

      // Get background context
      const messageRepo = DIContainer.getMessageRepository();
      const backgroundContext = await AIService.getAnchorContext(
        chatId,
        anchorMessageId,
        messageRepo,
      );

      const historicalString = backgroundContext
        .map((msg: any) => `[${msg.role}]: ${msg.content}`)
        .join('\n\n');

      const systemPrompt = AIService.buildQuickChatSystemPrompt(
        historicalString,
        highlightedText,
      );

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...recentHistory.map((msg: any) => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      ];

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let stream;
      try {
        stream = await AIService.streamAIContent(contents);
      } catch (error: any) {
        res.write(
          `data: ${JSON.stringify({ text: '\n\n**Quota Exhausted:** All your provided Gemini API keys have exceeded their free-tier limits. Please wait, or add a new key.' })}\n\n`,
        );
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      res.flushHeaders();

      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
      }
      res.write(
        `data: ${JSON.stringify({ text: '\n\n**System Error:** ' + error.message })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
    }
  };

  /**
   * Get a sub-chat (highlight conversation)
   * GET /api/chats/:id/subchat
   */
  public getSubChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, 'id');
      const subChatId = this.getQueryParam(req, 'subChatId');

      if (!subChatId) {
        throw new AppError('Sub-chat ID is required', 400);
      }

      const getSubChatUseCase = DIContainer.getGetSubChatUseCase();
      const subChat = await getSubChatUseCase.execute(chatId, subChatId, userId);

      this.sendSuccess(res, subChat);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  /**
   * Save a sub-chat (highlight conversation)
   * POST /api/chats/:id/subchat
   */




  public saveSubChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const chatId = this.getRouteParam(req, 'id');
      const { subChatId, anchorMessageId, highlightedText, messages, relativeY } =
        req.body;

      if (!anchorMessageId) {
        throw new AppError('Sub-chat ID and anchor message ID are required', 400);
      }

      const saveSubChatUseCase = DIContainer.getSaveSubChatUseCase();
     
      const subChat = await saveSubChatUseCase.execute(
        chatId,
        userId,
        subChatId,
        anchorMessageId,
        highlightedText,
        messages,
        relativeY,
      );

      this.sendSuccess(res, subChat, 201, 'Sub-chat saved successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

// Export singleton instance for use in routes
export const chatController = new ChatController();
