import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { IVectorRepository } from '../../../domain/vector/repositories/IVectorRepository';
import { SemanticChunkingService, ChunkingOptions } from '../../../services/SemanticChunkingService';
import { FileUploadService } from '../../../services/FileUploadService';
import crypto from 'crypto';
import fs from 'fs';
import { textToSparseVector } from '../../../utils/BM25Healper';

export class ProcessDocumentChunking {
  private chunkingService: SemanticChunkingService;

  constructor(
    private outboxRepository: IOutboxEventRepository,
    private vectorRepository: IVectorRepository
  ) {
    this.chunkingService = new SemanticChunkingService();
  }

  async execute(
    outboxId: string,
    filePath: string,
    userId: string,
    chatId: string,
    fileName: string,
    chunkingOptions?: ChunkingOptions
  ): Promise<void> {
    try {
      const outboxEvent = await this.outboxRepository.findById(outboxId);
      if (!outboxEvent) {
        throw new Error(`Outbox event not found: ${outboxId}`);
      }

      // Process document with semantic chunking
      const chunks = await this.chunkingService.processDocument(filePath, {
        minChunkTokens: 80,
        maxChunkTokens: 8000,
        embedChunks: true,
        ...chunkingOptions,
      });

      if (chunks.length === 0) {
        throw new Error('No chunks generated from document');
      }

      // Prepare vectors for Qdrant (direct vector format for document collection)
      const points = chunks.map(chunk => ({
        id: crypto.randomUUID(),
        vectors: {
        "dense-vector": chunk.embedding || new Array(768).fill(0),
        "bm25-vector": textToSparseVector(chunk.content),
      },
        payload: {
          sourceId: outboxEvent.payload.sourceId?.toString() || 'unknown',
          sourceType: 'document',
          userId,
          chatId,
          fileName,
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

      console.log(`✅ Processed ${chunks.length} semantic chunks from document: ${fileName}`);

     
      await this.outboxRepository.updateStatus(outboxId, 'processed');

      // Clean up temp file after successful processing
      try {
        if (filePath && fs.existsSync(filePath)) {
          await FileUploadService.cleanupTempFile(filePath);
          console.log(`🗑️ Cleaned up temp file: ${filePath}`);
        }
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to clean up temp file ${filePath}:`, cleanupError);
      }
    } catch (error: any) {
      await this.outboxRepository.updateStatus(outboxId, 'failed', {
        error: error.message,
        incrementRetry: true,
      });
      console.error(`❌ Document chunking failed for outbox ${outboxId}:`, error.message);
      throw error;
    }
  }
}
