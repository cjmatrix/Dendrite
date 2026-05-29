type EmbeddingTaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "CODE_RETRIEVAL_QUERY"
  | "QUESTION_ANSWERING"
  | "FACT_VERIFICATION"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING";

export class EmbeddingService {
  private endpoint: string;
  private model: string;
  private timeoutMs: number;

  constructor(
    endpoint: string = "http://localhost:7997/embeddings",
    model: string = "jinaai/jina-embeddings-v2-base-code",
    timeoutMs: number = 30000
  ) {
    this.endpoint = endpoint;
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async embed(
    text: string,
    taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"
  ): Promise<number[]> {
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

      const json = await response.json();
      const embedding = json.data?.[0]?.embedding;

      if (!embedding) {
        throw new Error("No embedding returned from Infinity local server");
      }

      return embedding;
    } catch (error: any) {
      console.error(" Jina Local Embedding failed:", error.message);
      throw error;
    }
  }

  async embedBatch(
    texts: string[],
    taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"
  ): Promise<number[][]> {
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

      const json = await response.json();
      const embeddings = json.data?.map((item: any) => item.embedding) ?? [];

      if (!embeddings || embeddings.length === 0) {
        throw new Error("No embeddings returned from Infinity local server");
      }

      return embeddings;
    } catch (error: any) {
      console.error(" Jina Local Batch Embedding failed:", error.message);
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

export const embeddingService = new EmbeddingService();
