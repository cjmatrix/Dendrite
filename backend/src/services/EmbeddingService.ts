import { container } from "tsyringe";
import { IEmbeddingService, EmbeddingTaskType } from "../application/common/ports/IEmbeddingService";

export class EmbeddingServiceDelegator implements IEmbeddingService {
  async embed(text: string, taskType?: EmbeddingTaskType): Promise<number[]> {
    return container.resolve<IEmbeddingService>("IEmbeddingService").embed(text, taskType);
  }

  async embedBatch(texts: string[], taskType?: EmbeddingTaskType): Promise<number[][]> {
    return container.resolve<IEmbeddingService>("IEmbeddingService").embedBatch(texts, taskType);
  }

  async healthCheck(): Promise<boolean> {
    return container.resolve<IEmbeddingService>("IEmbeddingService").healthCheck();
  }
}

export const embeddingService = new EmbeddingServiceDelegator();
