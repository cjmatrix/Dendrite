export interface DocumentChunk {
  content: string;
  startIndex: number;
  endIndex: number;
  tokenEstimate: number;
  embedding?: number[];
  metadata: {
    headings: string[];
    kinds: string[];
    chunkIndex: number;
    totalChunks?: number;
  };
}

export interface DocumentChunkingOptions {
  minChunkTokens?: number;
  maxChunkTokens?: number;
  embedChunks?: boolean;
}

export interface IDocumentChunkingService {
  processDocument(
    filePath: string,
    options?: DocumentChunkingOptions,
  ): Promise<DocumentChunk[]>;
}
