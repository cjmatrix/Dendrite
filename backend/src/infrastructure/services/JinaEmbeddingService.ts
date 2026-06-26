import { IEmbeddingService, EmbeddingTaskType } from "../../application/common/ports/IEmbeddingService";

export class JinaEmbeddingService implements IEmbeddingService {
  private endpoint: string;
  private model: string;

  constructor() {
    this.endpoint = "http://localhost:7997/embeddings";
    this.model = "jinaai/jina-embeddings-v2-base-code";
  }

  async embed(text: string, taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"): Promise<number[]> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          input: [text],
        }),
      });

      if (!response.ok) {
        throw new Error(`Infinity API responded with status: ${response.status}`);
      }

      const json = await response.json() as { data?: { embedding?: number[] }[] };
      const embedding = json.data?.[0]?.embedding;

      if (!embedding) {
        throw new Error("No embedding returned from Infinity local server");
      }

      return embedding;
    } catch (error: unknown) {
      console.error(" Jina Local Embedding failed:", (error as Error).message);
      throw error;
    }
  }

  async embedBatch(texts: string[], taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"): Promise<number[][]> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          input: texts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Infinity API responded with status: ${response.status}`);
      }

      const json = await response.json() as { data?: { embedding?: number[] }[] };
      const embeddings = json.data?.map((item) => item.embedding ?? []) ?? [];

      if (!embeddings || embeddings.length === 0) {
        throw new Error("No embeddings returned from Infinity local server");
      }

      return embeddings;
    } catch (error: unknown) {
      console.error(" Jina Local Batch Embedding failed:", (error as Error).message);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const modelsEndpoint = this.endpoint.replace("/embeddings", "/models");
      const response = await fetch(modelsEndpoint, { method: "GET" });
      return response.ok;
    } catch {
      return false;
    }
  }
}
