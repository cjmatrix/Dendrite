import { injectable, inject } from "tsyringe";
import crypto from "crypto";
import fs from "fs";
import { IDocumentChunkingService } from "../../common/ports/IDocumentChunkingService";
import { IDocumentProgressPublisher } from "../../common/ports/IDocumentProgressPublisher";
import { IVectorRepository } from "../../../domain/vector/repositories/IVectorRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IUploadedDocumentRepository } from "../../../domain/chat/repositories/IUploadedDocumentRepository";
import { IContentHashRepository } from "../../../domain/chat/repositories/IContentHashRepository";
import { ILogger } from "../../common/ports/ILogger";
import { textToSparseVector } from "../../../utils/BM25Healper";

export interface ProcessDocumentChunkingInput {
  filePath: string;
  userId: string;
  chatId: string;
  fileName: string;
  cloudinaryUrl: string;
  documentId: string;
}

@injectable()
export class ProcessDocumentChunking {
  constructor(
    @inject("IDocumentChunkingService")
    private chunkingService: IDocumentChunkingService,
    @inject("IDocumentProgressPublisher")
    private progressPublisher: IDocumentProgressPublisher,
    @inject("IVectorRepository") private vectorRepository: IVectorRepository,
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IUploadedDocumentRepository")
    private uploadedDocumentRepository: IUploadedDocumentRepository,
    @inject("IContentHashRepository")
    private contentHashRepository: IContentHashRepository,
    @inject("ILogger") private logger: ILogger,
  ) {}

  async execute(input: ProcessDocumentChunkingInput): Promise<void> {
    const { filePath, userId, chatId, fileName, cloudinaryUrl, documentId } =
      input;

    await this.progressPublisher.publish({
      documentId,
      chatId,
      userId,
      fileName,
      stage: "chunk",
      status: "chunking",
      progress: 70,
      cloudinaryUrl,
      message: "Extracting and chunking document",
    });

    const { chunks, contentHash } = await this.chunkingService.processDocument(filePath, {
      minChunkTokens: 80,
      maxChunkTokens: 8000,
      embedChunks: true,
    });

    if (chunks.length === 0) {
      throw new Error("No chunks generated from document");
    }

    const points = chunks.map((chunk) => ({
      id: crypto.randomUUID(),
      vectors: {
        "dense-vector": chunk.embedding || new Array(1024).fill(0),
        "bm25-vector": textToSparseVector(chunk.content),
      },
      payload: {
        sourceType: "document",
        userId,
        chatId,
        fileName,
        fileUrl: cloudinaryUrl,
        contentHash,
        content: {
          text: chunk.content,
          chunkIndex: chunk.metadata.chunkIndex,
          totalChunks: chunk.metadata.totalChunks,
          headings: chunk.metadata.headings,
          kinds: chunk.metadata.kinds,
        },
        tokenEstimate: chunk.tokenEstimate,
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex,
      },
    }));

    await this.vectorRepository.upsertDocumentVectors(points);

   
    try {
     
      const existingHash = await this.contentHashRepository.findByHash(contentHash);
      if (!existingHash) {
        await this.contentHashRepository.create({
          contentHash,
          fileUrl: cloudinaryUrl,
          status: "active",
          expireAt: null,
        });
      } else if (existingHash.status === "expired") {
        existingHash.status = "active";
        existingHash.expireAt = null;
        await this.contentHashRepository.save(existingHash);
      }

      const extension = fileName.split(".").pop() || "pdf";

      const uploadedDoc = await this.uploadedDocumentRepository.create({
        chatId,
        userId,
        fileType: "document",
        filename: fileName,
        extension,
        fileUrl: cloudinaryUrl,
        contentHash,
      });

      await this.chatRepository.addDocumentToChat(
        { chatId, userId },
        uploadedDoc._id,
      );
    } catch (err) {
      this.logger.error("Failed to update Chat with document after chunking", err);
    }

    await this.progressPublisher.publish({
      documentId,
      chatId,
      userId,
      fileName,
      stage: "chunk",
      status: "completed",
      progress: 100,
      cloudinaryUrl,
      message: "Document is ready for RAG",
    });

    this.logger.info(
      `Processed ${chunks.length} semantic chunks from document: ${fileName}`,
    );
  }
}