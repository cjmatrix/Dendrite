import { IRerankerService, RerankResult } from "../../application/common/ports/IRerankerService";
import dotenv from "dotenv";
dotenv.config();

export class VoyageRerankerService implements IRerankerService {
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.VOYAGE_API_KEY || "";
    this.defaultModel = "rerank-2.5-lite";
  }

  async rerank<T>(
    query: string,
    documents: { text: string; item: T }[],
    model: string = this.defaultModel
  ): Promise<RerankResult<T>[]> {
    if (documents.length === 0) return [];

    if (!this.apiKey) {
      console.warn("[VoyageRerankerService] VOYAGE_API_KEY is not defined. Skipping reranking.");
      return documents.map(d => ({ score: 0, document: d.item }));
    }

    try {
      const texts = documents.map(d => d.text);
      const response = await fetch("https://api.voyageai.com/v1/rerank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          documents: texts,
          model,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Voyage Rerank API responded with status ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      const data = json.data as { index: number; relevance_score: number }[];

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from Voyage Rerank API");
      }

      return data
        .map((item) => {
          const originalDoc = documents[item.index];
          if (!originalDoc) return null;
          return {
            score: item.relevance_score,
            document: originalDoc.item,
          };
        })
        .filter((res): res is RerankResult<T> => res !== null);
    } catch (error: unknown) {
      console.error("[VoyageRerankerService] Voyage Reranking failed:", (error as Error).message);
      throw error;
    }
  }
}
