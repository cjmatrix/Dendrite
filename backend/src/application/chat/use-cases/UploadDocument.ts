import { injectable, inject } from "tsyringe";
import crypto from "crypto";
import { IUploadDocumentUseCase } from "./interfaces";
import { UploadDocumentInputDTO, UploadDocumentOutputDTO } from "../dtos/chat.dto";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IDocumentQueue } from "../../common/ports/IDocumentQueue";
import { AppError } from "../../../utils/AppError";
import { ILogger } from "../../common/ports/ILogger";
import { documentProgressPubSub } from "../../../services/documentProgressPubSub";

@injectable()
export class UploadDocument implements IUploadDocumentUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IDocumentQueue") private documentQueue: IDocumentQueue,
    @inject("ILogger") private logger: ILogger
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

    await this.documentQueue.enqueueChunkingJob({
      documentId,
      tempFilePath: filePath,
      fileName: documentFileName,
      userId,
      chatId,
      createdAt: new Date().toISOString(),
    });

    await documentProgressPubSub.publish({
      documentId,
      chatId,
      userId,
      fileName: documentFileName,
      stage: "upload",
      status: "queued",
      progress: 0,
      message: "Document queued for processing",
    });

    this.logger.info(`Document upload queued`, { documentId, fileName: documentFileName, chatId });

    return {
      documentId,
      fileName: documentFileName,
      status: "uploading",
    };
  }
}
