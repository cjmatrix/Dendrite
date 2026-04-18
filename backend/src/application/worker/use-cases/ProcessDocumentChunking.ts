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
    filePath: string,
    userId: string,
    chatId: string,
    fileName: string,
    chunkingOptions?: ChunkingOptions
  ): Promise<void> {
    try {

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



      // Prepare vectors for Qdrant 


      const points = chunks.map(chunk => ({
        id: crypto.randomUUID(),
        vectors: {
        "dense-vector": chunk.embedding || new Array(768).fill(0),
        "bm25-vector": textToSparseVector(chunk.content),
      },
        payload: {
        
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

      console.log(`Processed ${chunks.length} semantic chunks from document: ${fileName}`);
    } catch (error: any) {
      throw error;
    }
  }
}