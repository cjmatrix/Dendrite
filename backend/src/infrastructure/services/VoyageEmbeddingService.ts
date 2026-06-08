import { IEmbeddingService, EmbeddingTaskType } from "../../application/common/ports/IEmbeddingService";
import dotenv from "dotenv";
dotenv.config();

export class VoyageEmbeddingService implements IEmbeddingService {
  private endpoint: string;
  private model: string;
  private apiKey: string;
  private dimension: number;

  constructor() {
    this.endpoint = "https://api.voyageai.com/v1/embeddings";
    this.model = "voyage-code-3";
    this.apiKey = process.env.VOYAGE_API_KEY || "";
    this.dimension = 1024;
  }

  private mapTaskType(taskType: EmbeddingTaskType): "document" | "query" | undefined {
    if (taskType === "RETRIEVAL_DOCUMENT") return "document";
    if (taskType === "RETRIEVAL_QUERY" || taskType === "CODE_RETRIEVAL_QUERY") return "query";
    return undefined;
  }

  async embed(text: string, taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"): Promise<number[]> {
    try {
      if (!this.apiKey) {
        throw new Error("VOYAGE_API_KEY is not defined in environment variables");
      }

      const inputType = this.mapTaskType(taskType);
      const bodyPayload: any = {
        model: this.model,
        input: [text],
        output_dimension: this.dimension
      };
      if (inputType) {
        bodyPayload.input_type = inputType;
      }

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Voyage AI API responded with status ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      const embedding = json.data?.[0]?.embedding;

      if (!embedding) {
        throw new Error("No embedding returned from Voyage AI API");
      }

      return embedding;
    } catch (error: any) {
      console.error(" Voyage Embedding failed:", error.message);
      throw error;
    }
  }

  async embedBatch(texts: string[], taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"): Promise<number[][]> {
    try {
      if (!this.apiKey) {
        throw new Error("VOYAGE_API_KEY is not defined in environment variables");
      }

      const inputType = this.mapTaskType(taskType);
      const BATCH_SIZE = 100;
      const allEmbeddings: number[][] = [];

      // Process in chunks to prevent memory heap OOM and stay within Voyage API limits (max 1000 items)
      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batchTexts = texts.slice(i, i + BATCH_SIZE);
        
        const bodyPayload: any = {
          model: this.model,
          input: batchTexts,
          output_dimension: this.dimension
        };
        if (inputType) {
          bodyPayload.input_type = inputType;
        }

        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Voyage AI API responded with status ${response.status}: ${errorText}`);
        }

        const json = await response.json();
        const batchEmbeddings = json.data?.map((item: any) => item.embedding) ?? [];

        if (!batchEmbeddings || batchEmbeddings.length === 0) {
          throw new Error("No embeddings returned from Voyage AI API for batch");
        }

        allEmbeddings.push(...batchEmbeddings);
      }

      return allEmbeddings;
    } catch (error: any) {
      console.error(" Voyage Batch Embedding failed:", error.message);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    return !!this.apiKey;
  }
}
