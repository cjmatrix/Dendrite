import { IVectorRepository } from '../../../domain/vector/repositories/IVectorRepository';
import {
  qdrantClient,
  COLLECTION_NAME,
  SUMMARY_COLLECTION_NAME,
} from '../../../config/qdrant';

const SIMILARITY_THRESHOLD = 0.62;

export class QdrantVectorRepository implements IVectorRepository {
  async searchSimilarCode(
    codeQueryVector: number[],
    descQueryVector: number[],
    userId: string,
    chatIds: string[],
    topK: number = 3,
  ): Promise<any[]> {
    try {
      const filter = {
        must: [
          {
            key: "userId",
            match: { value: String(userId) },
          },
          {
            key: "chatId",
            match: { any: chatIds.map(String) },
          },
        ],
      };

      const [codeResults, descriptionResults] = await Promise.all([
        qdrantClient.search(COLLECTION_NAME, {
          vector: { name: "code", vector: codeQueryVector },
          limit: topK,
          filter,
          with_payload: true,
        }),
        qdrantClient.search(COLLECTION_NAME, {
          vector: { name: "description", vector: descQueryVector },
          limit: topK,
          filter,
          with_payload: true,
        }),
      ]);

      const scoreMap = new Map();

      for (let result of [...codeResults, ...descriptionResults]) {
        const id = String(result.id);
        const existing = scoreMap.get(id);
        if (!existing || result.score > existing.score) {
          scoreMap.set(id, result);
        }
      }

      const merged = Array.from(scoreMap.values())
        .filter((r) => r.score >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return merged.map((result) => ({
        score: result.score,
        codeBlockId: result.id,
        content: result.payload?.content,
        language: result.payload?.language,
        chatId: result.payload?.chatId,
      }));
    } catch (error: any) {
      const errorDetails = error.data || error.response?.data || error.message;
      console.error("❌ Qdrant search failed:", errorDetails);
      return [];
    }
  }

  async searchSimilarChatChunk(
    chunkQueryVector: number[],
    userId: string,
    chatIds: string[],
    topK: number = 5,
  ): Promise<any[]> {
    try {
      const searchResults = await qdrantClient.search(SUMMARY_COLLECTION_NAME, {
        vector: chunkQueryVector,
        limit: topK,
        filter: {
          must: [
            {
              key: "userId",
              match: { value: String(userId) },
            },
            {
              key: "chatId",
              match: { any: chatIds.map(String) },
            },
          ],
        },
        with_payload: true,
      });

      const relevantResults = searchResults.filter(
        (result) => result.score >= SIMILARITY_THRESHOLD,
      );

      return relevantResults.map((result) => ({
        score: result.score,
        fact: result.payload?.content as { fact: string },
      }));
    } catch (error: any) {
      const errorDetails = error.data || error.response?.data || error.message;
      console.error("❌ Qdrant summary search failed:", errorDetails);
      return [];
    }
  }

  async deleteVectorsByChatIds(userId: string, chatIds: string[]): Promise<void> {
    if (chatIds.length === 0) return;

    const filter = {
      must: [
        { key: "userId", match: { value: String(userId) } },
        { key: "chatId", match: { any: chatIds.map(String) } },
      ],
    };

    try {
      await qdrantClient.delete(COLLECTION_NAME, { filter });
      await qdrantClient.delete(SUMMARY_COLLECTION_NAME, { filter });
      console.log(`✅ Deleted Qdrant vectors for ${chatIds.length} chats`);
    } catch (err: any) {
      console.error("❌ Qdrant delete failed:", err?.message ?? err);
      
      throw err; 
    }
  }

  async upsertCodeVector(
    id: string,
    codeVector: number[],
    descriptionVector: number[],
    payload: any
  ): Promise<void> {
    await qdrantClient.upsert(COLLECTION_NAME, {
      points: [
        {
          id,
          vector: {
            code: codeVector,
            description: descriptionVector,
          },
          payload,
        },
      ],
    });
  }

  async upsertSummaryVectors(points: any[]): Promise<void> {
    if (points.length === 0) return;
    await qdrantClient.upsert(SUMMARY_COLLECTION_NAME, { points });
  }

  async searchSemanticCache(queryVector: number[], minTimestamp: number): Promise<any[]> {
    return await qdrantClient.search("search_cache", {
      vector: queryVector,
      limit: 1,
      with_payload: true,
      filter: {
        must: [
          {
            key: "createdAt",
            range: { gte: minTimestamp },
          },
        ],
      },
    });
  }

  async upsertSearchCache(id: string, queryVector: number[], payload: any): Promise<void> {
    await qdrantClient.upsert("search_cache", {
      points: [
        {
          id,
          vector: queryVector,
          payload,
        },
      ],
    });
  }

  async deleteOldSearchCache(minTimestamp: number): Promise<void> {
    await qdrantClient.delete("search_cache", {
      filter: {
        must: [
          {
            key: "createdAt",
            range: { lt: minTimestamp },
          },
        ],
      },
    });
  }

  async upsertDocumentVectors(points: any[]): Promise<void> {
    if (points.length === 0) return;
    try {
      await qdrantClient.upsert(COLLECTION_NAME, { points });
      console.log(`✅ Upserted ${points.length} document vectors to Qdrant`);
    } catch (error: any) {
      console.error("❌ Failed to upsert document vectors:", error?.message ?? error);
      throw error;
    }
  }

  async searchDocuments(
    queryVector: number[],
    userId: string,
    chatIds: string[],
    topK: number = 5
  ): Promise<any[]> {
    try {
      const filter = {
        must: [
          {
            key: "userId",
            match: { value: String(userId) },
          },
          {
            key: "sourceType",
            match: { value: "document" },
          },
          {
            key: "chatId",
            match: { any: chatIds.map(String) },
          },
        ],
      };

      const results = await qdrantClient.search(COLLECTION_NAME, {
        vector: { name: "code", vector: queryVector }, // Using code vector for similarity
        limit: topK,
        filter,
        with_payload: true,
      });

      const relevantResults = results.filter(
        (result) => result.score >= SIMILARITY_THRESHOLD,
      );

      return relevantResults.map((result) => ({
        score: result.score,
        document: result.payload?.content as {
          text: string;
          chunkIndex: number;
          totalChunks: number;
          headings: string[];
          kinds: string[];
        },
        metadata: result.payload,
      }));
    } catch (error: any) {
      console.error("❌ Document search failed:", error?.message ?? error);
      return [];
    }
  }
}

