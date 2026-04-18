import { Queue, Worker } from 'bullmq';
import fs from 'fs';
import crypto from 'crypto';

import { DIContainer } from '../controllers/container/DIContainer';
import { ProcessDocumentChunking } from '../application/worker/use-cases/ProcessDocumentChunking';
import { FileUploadService } from '../services/FileUploadService';

import { redisConfig } from '../config/redis';

export const documentChunkingQueue = new Queue('document-chunking', { connection:redisConfig});

interface DocumentChunkingJobStage1 {
  stage: 'upload';
  documentId: string;
  tempFilePath: string;
  fileName: string;
  userId: string;
  chatId: string;
  createdAt: string;
}

interface DocumentChunkingJobStage2 {
  stage: 'chunk';
  documentId: string;
  cloudinaryUrl?: string;
  filePath?: string;
  fileName: string;
  userId: string;
  chatId: string;
}

type DocumentChunkingJob = DocumentChunkingJobStage1 | DocumentChunkingJobStage2;



new Worker(
  'document-chunking',
  async (job: any) => {
    const { stage, documentId, fileName, userId, chatId } = job.data as DocumentChunkingJob;

    console.log(`Processing document: ${documentId} | Stage: ${stage}`);

    try {

      // STAGE 1: UPLOAD TO CLOUDINARY
    
      if (stage === 'upload') {
        const { tempFilePath } = job.data as DocumentChunkingJobStage1;

        console.log(`[Stage 1] Uploading to Cloudinary: ${fileName}`);
        await job.updateProgress(5);

      
        if (!fs.existsSync(tempFilePath)) {
          throw new Error(`Temp file not found: ${tempFilePath}`);
        }

     
        const result = await FileUploadService.uploadDocumentToCloudinary(tempFilePath);
        console.log(`[Stage 1] Upload complete: ${result.secure_url}`);

        await job.updateProgress(15);

       
        await documentChunkingQueue.add(
          'chunk-document',
          {
            stage: 'chunk',
            documentId,
            cloudinaryUrl: result.secure_url,
            filePath: tempFilePath,
            fileName,
            userId,
            chatId
          },
          {
            jobId: `${documentId}-chunk`,
            priority: 10,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            }
          }
        );

        console.log(`Queued Stage 2 for document: ${documentId}`);

        return {
          stage: 'upload',
          status: 'complete',
          cloudinaryUrl: result.secure_url,
          nextStage: 'chunk'
        };
      }

       // STAGE 2: DOCUMENT CHUNKING

      if (stage === 'chunk') {
        const { cloudinaryUrl, filePath: stageFilePath } = job.data as DocumentChunkingJobStage2;
        const processingPath = stageFilePath || cloudinaryUrl;

        if (!processingPath) {
          throw new Error('Neither filePath nor cloudinaryUrl provided for Stage 2');
        }

        console.log(`[Stage 2] Processing: ${processingPath}`);
        await job.updateProgress(20);

        const outboxRepo = DIContainer.getOutboxEventRepository();
        const vectorRepo = DIContainer.getVectorRepository();

        const processor = new ProcessDocumentChunking(outboxRepo, vectorRepo);

        // Execute chunking
        await processor.execute(
          processingPath,
          userId,
          chatId,
          fileName
        );

        await job.updateProgress(100);

    
        if (stageFilePath && fs.existsSync(stageFilePath)) {
          fs.unlinkSync(stageFilePath);
          console.log(`Cleaned up temp file after chunking: ${stageFilePath}`);
        }

        console.log(`[Stage 2] Document ${documentId} processed successfully`);

        return {
          stage: 'chunk',
          status: 'complete',
          documentId
        };
      }

      throw new Error(`Unknown stage: ${stage}`);

    } catch (error: any) {
      console.error(`Error processing document ${documentId}:`, error);

      // Cleanup on error
      if (stage === 'upload') {
        const { tempFilePath } = job.data as DocumentChunkingJobStage1;
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log(`Cleaned up temp file on error`);
        }
      } else if (stage === 'chunk') {
        const { filePath: stageFilePath } = job.data as DocumentChunkingJobStage2;
        if (stageFilePath && fs.existsSync(stageFilePath)) {
          fs.unlinkSync(stageFilePath);
          console.log(`Cleaned up chunk temp file on error`);
        }
      }

      throw error; // BullMQ will retry
    }
  },
  {
    connection: redisConfig,
    concurrency: 2,
  }
);

// HANDLE JOB COMPLETION
documentChunkingQueue.on('completed' as any, (job: any) => {
  const { stage, documentId } = job.data;
  console.log(`Document job completed: ${documentId} | Stage: ${stage}`);
});

// HANDLE JOB FAILURE
documentChunkingQueue.on('failed' as any, (job: any, err: any) => {
  const { stage, documentId } = job.data;
  console.error(`Document job failed: ${documentId} | Stage: ${stage} | Error: ${err.message}`);
});

export default documentChunkingQueue;
