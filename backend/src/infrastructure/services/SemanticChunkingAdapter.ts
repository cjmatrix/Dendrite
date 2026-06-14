import { injectable } from "tsyringe";
import {
  IDocumentChunkingService,
  DocumentChunk,
  DocumentChunkingOptions,
  ChunkingResult,
} from "../../application/common/ports/IDocumentChunkingService";
import { SemanticChunkingService } from "../../services/SemanticChunkingService";

@injectable()
export class SemanticChunkingAdapter implements IDocumentChunkingService {
  constructor(
    private readonly chunkingService: SemanticChunkingService,
  ) {}

  async processDocument(
    filePath: string,
    options?: DocumentChunkingOptions,
  ): Promise<ChunkingResult> {
    return this.chunkingService.processDocument(filePath, options);
  }
}
