import { injectable, inject } from "tsyringe";
import fs from "fs";
import { IFileStorageService } from "../../common/ports/IFileStorageService";
import { IDocumentProgressPublisher } from "../../common/ports/IDocumentProgressPublisher";
import { IDocumentQueue } from "../../common/ports/IDocumentQueue";
import { ILogger } from "../../common/ports/ILogger";

export interface ProcessDocumentUploadInput {
  documentId: string;
  tempFilePath: string;
  fileName: string;
  userId: string;
  chatId: string;
}

export interface ProcessDocumentUploadOutput {
  cloudinaryUrl: string;
}

@injectable()
export class ProcessDocumentUpload {
  constructor(
    @inject("IFileStorageService")
    private fileStorageService: IFileStorageService,
    @inject("IDocumentProgressPublisher")
    private progressPublisher: IDocumentProgressPublisher,
    @inject("IDocumentQueue") private documentQueue: IDocumentQueue,
    @inject("ILogger") private logger: ILogger,
  ) {}

  async execute(
    input: ProcessDocumentUploadInput,
  ): Promise<ProcessDocumentUploadOutput> {
    const { documentId, tempFilePath, fileName, userId, chatId } = input;

    await this.progressPublisher.publish({
      documentId,
      chatId,
      userId,
      fileName,
      stage: "upload",
      status: "uploading",
      progress: 15,
      message: "Uploading document to storage",
    });

    if (!fs.existsSync(tempFilePath)) {
      throw new Error(`Temp file not found: ${tempFilePath}`);
    }

    const result = await this.fileStorageService.uploadDocument(tempFilePath);

    this.logger.info(`Document uploaded to storage: ${result.url}`, {
      documentId,
      fileName,
    });

    await this.progressPublisher.publish({
      documentId,
      chatId,
      userId,
      fileName,
      stage: "upload",
      status: "uploaded",
      progress: 40,
      cloudinaryUrl: result.url,
      message: "Upload complete, queuing chunking",
    });

    await this.documentQueue.enqueueChunkStage({
      documentId,
      cloudinaryUrl: result.url,
      filePath: tempFilePath,
      fileName,
      userId,
      chatId,
    });

    return { cloudinaryUrl: result.url };
  }
}
