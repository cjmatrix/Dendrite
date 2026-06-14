import { injectable, inject } from "tsyringe";
import crypto from "crypto";
import fs from "fs";
import { IUploadDocumentUseCase } from "./interfaces";
import { UploadDocumentInputDTO, UploadDocumentOutputDTO } from "../dtos/chat.dto";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IUploadedDocumentRepository } from "../../../domain/chat/repositories/IUploadedDocumentRepository";
import { IContentHashRepository } from "../../../domain/chat/repositories/IContentHashRepository";
import { IDocumentQueue } from "../../common/ports/IDocumentQueue";
import { IDocumentProgressPublisher } from "../../common/ports/IDocumentProgressPublisher";
import { AppError } from "../../../utils/AppError";
import { ILogger } from "../../common/ports/ILogger";
import { computeFileHash } from "../../../utils/fileHasher";

@injectable()
export class UploadDocument implements IUploadDocumentUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IUploadedDocumentRepository") private uploadedDocumentRepository: IUploadedDocumentRepository,
    @inject("IContentHashRepository") private contentHashRepository: IContentHashRepository,
    @inject("IDocumentQueue") private documentQueue: IDocumentQueue,
    @inject("IDocumentProgressPublisher")
    private progressPublisher: IDocumentProgressPublisher,
    @inject("ILogger") private logger: ILogger,
  ) {}

  async execute(input: UploadDocumentInputDTO): Promise<UploadDocumentOutputDTO> {
    const { userId, chatId, filePath, fileName } = input;

    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found or access denied", 404);
    }

    if (!filePath) {
      throw new AppError("No file uploaded", 400);
    }

    const documentFileName = fileName || "document";
    const documentId = crypto.randomUUID();

   
    const contentHash = computeFileHash(filePath);

  
    const hashRecord = await this.contentHashRepository.findByHash(contentHash);
    if (hashRecord) {
      this.logger.info(`Document cache HIT for hash: ${contentHash}. Skipping chunking.`);

      if (hashRecord.status === "expired") {
        hashRecord.status = "active";
        hashRecord.expireAt = null;
        await this.contentHashRepository.save(hashRecord);
      }

      const existingUpload = await this.uploadedDocumentRepository.findByChatIdAndFilename(chatId, documentFileName);
      if (existingUpload) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        await this.progressPublisher.publish({
          documentId,
          chatId,
          userId,
          fileName: documentFileName,
          stage: "chunk",
          status: "completed",
          progress: 100,
          cloudinaryUrl: existingUpload.fileUrl,
          message: "Document is ready (already exists in chat)",
        });

        return {
          documentId,
          fileName: documentFileName,
          status: "completed",
        };
      }

      const extension = documentFileName.split(".").pop() || "pdf";

      const uploadedDoc = await this.uploadedDocumentRepository.create({
        chatId,
        userId,
        fileType: "document",
        filename: documentFileName,
        extension,
        fileUrl: hashRecord.fileUrl,
        contentHash,
      });

      await this.chatRepository.addDocumentToChat({ chatId, userId }, uploadedDoc._id);

      await this.progressPublisher.publish({
        documentId,
        chatId,
        userId,
        fileName: documentFileName,
        stage: "chunk",
        status: "completed",
        progress: 100,
        cloudinaryUrl: hashRecord.fileUrl,
        message: "Document is ready (loaded from cache)",
      });

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        documentId,
        fileName: documentFileName,
        status: "completed",
      };
    }


    await this.documentQueue.enqueueChunkingJob({
      documentId,
      tempFilePath: filePath,
      fileName: documentFileName,
      userId,
      chatId,
      createdAt: new Date().toISOString(),
    });

    await this.progressPublisher.publish({
      documentId,
      chatId,
      userId,
      fileName: documentFileName,
      stage: "upload",
      status: "queued",
      progress: 0,
      message: "Document queued for processing",
    });

    this.logger.info(`Document upload queued (cache MISS)`, {
      documentId,
      fileName: documentFileName,
      chatId,
    });

    return {
      documentId,
      fileName: documentFileName,
      status: "uploading",
    };
  }
}
