import { Queue, Worker } from "bullmq";
import fs from "fs";
import { container } from "tsyringe";
import { redisConfig } from "../config/redis";
import { ProcessDocumentUpload } from "../application/worker/use-cases/ProcessDocumentUpload";
import { ProcessDocumentChunking } from "../application/worker/use-cases/ProcessDocumentChunking";
import { ILogger } from "../application/common/ports/ILogger";

export const documentChunkingQueue = new Queue("document-chunking", {
  connection: redisConfig,
});

interface DocumentUploadJobData {
  stage: "upload";
  documentId: string;
  tempFilePath: string;
  fileName: string;
  userId: string;
  chatId: string;
  createdAt: string;
}

interface DocumentChunkJobData {
  stage: "chunk";
  documentId: string;
  cloudinaryUrl: string;
  filePath?: string;
  fileName: string;
  userId: string;
  chatId: string;
}

type DocumentJobData = DocumentUploadJobData | DocumentChunkJobData;

new Worker(
  "document-chunking",
  async (job) => {
    const data = job.data as DocumentJobData;
    const logger = container.resolve<ILogger>("ILogger");

    logger.info(`Processing document: ${data.documentId} | Stage: ${data.stage}`);

    try {
      if (data.stage === "upload") {
        await job.updateProgress(5);

        const uploadUseCase = container.resolve(ProcessDocumentUpload);
        const result = await uploadUseCase.execute({
          documentId: data.documentId,
          tempFilePath: data.tempFilePath,
          fileName: data.fileName,
          userId: data.userId,
          chatId: data.chatId,
        });

        await job.updateProgress(40);

        return {
          stage: "upload",
          status: "complete",
          cloudinaryUrl: result.cloudinaryUrl,
          nextStage: "chunk",
        };
      }

      if (data.stage === "chunk") {
        const processingPath = data.filePath || data.cloudinaryUrl;

        if (!processingPath) {
          throw new Error(
            "Neither filePath nor cloudinaryUrl provided for chunking stage",
          );
        }

        await job.updateProgress(20);

        const chunkingUseCase = container.resolve(ProcessDocumentChunking);
        await chunkingUseCase.execute({
          filePath: processingPath,
          userId: data.userId,
          chatId: data.chatId,
          fileName: data.fileName,
          cloudinaryUrl: data.cloudinaryUrl,
          documentId: data.documentId,
        });

        await job.updateProgress(100);

        // Cleanup temp file after successful chunking
        if (data.filePath && fs.existsSync(data.filePath)) {
          fs.unlinkSync(data.filePath);
          logger.info(`Cleaned up temp file after chunking: ${data.filePath}`);
        }

        return {
          stage: "chunk",
          status: "complete",
          documentId: data.documentId,
        };
      }

      throw new Error(`Unknown stage: ${(data as any).stage}`);
    } catch (error: any) {
      logger.error(
        `Error processing document ${data.documentId}: ${error.message}`,
      );

      // Cleanup temp files on error
      if (data.stage === "upload" && fs.existsSync(data.tempFilePath)) {
        fs.unlinkSync(data.tempFilePath);
      } else if (
        data.stage === "chunk" &&
        data.filePath &&
        fs.existsSync(data.filePath)
      ) {
        fs.unlinkSync(data.filePath);
      }

      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 2,
  },
);

documentChunkingQueue.on("completed" as any, (job: any) => {
  const { stage, documentId } = job.data;
  console.log(`Document job completed: ${documentId} | Stage: ${stage}`);
});

documentChunkingQueue.on("failed" as any, (job: any, err: any) => {
  const { stage, documentId } = job.data;
  console.error(
    `Document job failed: ${documentId} | Stage: ${stage} | Error: ${err.message}`,
  );
});

export default documentChunkingQueue;
