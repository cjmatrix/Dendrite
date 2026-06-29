import { injectable, inject } from 'tsyringe';
import { IRerankerService } from '../../../application/common/ports/IRerankerService';
import { IVectorRepository, IVectorSearchResult, IVectorPoint } from '../../../domain/vector/repositories/IVectorRepository';
import {
  qdrantClient,
  COLLECTION_NAME,
  SUMMARY_COLLECTION_NAME,
  DOCUMENT_COLLECTION_NAME
} from '../../../config/qdrant';
import { textToSparseVector } from '../../../utils/BM25Healper';

const SIMILARITY_THRESHOLD = 0.60;

@injectable()
export class QdrantVectorRepository implements IVectorRepository {
  constructor(
    @inject("IRerankerService") private rerankerService: IRerankerService
  ) {}

  async searchSimilarCode(
    queryText: string,
    codeQueryVector: number[],
    descQueryVector: number[],
    userId: string,
    chatIds: string[],
    topK: number = 3,
  ): Promise<IVectorSearchResult[]> {
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

      const sparseVector = textToSparseVector(queryText);
      const limitCandidates = Math.max(topK * 4, 20);

      const [codeResults, descriptionResults] = await Promise.all([
        qdrantClient.query(COLLECTION_NAME, {
          prefetch: [
            {
              using: "code",
              query: codeQueryVector,
              filter,
              limit: limitCandidates,
              score_threshold: 0.49,
            },
            {
              using: "code-sparse",
              query: sparseVector,
              filter,
              limit: limitCandidates,
            },
          ],
          query: { rrf: { fusion: "rrf" } },
          limit: limitCandidates,
          with_payload: true,
        }),
        qdrantClient.query(COLLECTION_NAME, {
          prefetch: [
            {
              using: "description",
              query: descQueryVector,
              filter,
              limit: limitCandidates,
              score_threshold: 0.49,
            },
            {
              using: "description-sparse",
              query: sparseVector,
              filter,
              limit: limitCandidates,
            },
          ],
          query: { rrf: { fusion: "rrf" } },
          limit: limitCandidates,
          with_payload: true,
        }),
      ]);

      const scoreMap = new Map<string, { id: string | number; score: number; payload?: Record<string, unknown> | null }>();

      for (const result of [...codeResults.points, ...descriptionResults.points]) {
        const id = String(result.id);
        const existing = scoreMap.get(id);
        if (!existing || (result.score ?? 0) > existing.score) {
          scoreMap.set(id, result as { id: string | number; score: number; payload?: Record<string, unknown> | null });
        }
      }

      const merged = Array.from(scoreMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return merged.map((result) => ({
        id: String(result.id),
        score: result.score,
        payload: (result.payload ?? {}) as Record<string, unknown>,
        content: result.payload?.['content'] as Record<string, unknown>,
        language: result.payload?.['language'] as string,
      }));
    } catch (error: unknown) {
      const err = error as { data?: unknown; response?: { data?: unknown }; message?: string };
      console.error(" Qdrant search failed:", err.data || err.response?.data || err.message);
      return [];
    }
  }

  async searchSimilarChatChunk(
    chunkQueryVector: number[],
    userId: string,
    chatIds: string[],
    topK: number = 5,
  ): Promise<IVectorSearchResult[]> {
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
        id: String(result.id),
        score: result.score,
        payload: (result.payload ?? {}) as Record<string, unknown>,
        fact: result.payload?.['content'] as Record<string, unknown>,
      }));
    } catch (error: unknown) {
      const err = error as { data?: unknown; response?: { data?: unknown }; message?: string };
      console.error(" Qdrant summary search failed:", err.data || err.response?.data || err.message);
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
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error(" Qdrant delete failed:", e?.message ?? err);
      throw err;
    }
  }

  async deleteDocumentVectorsByFileUrl(userId: string | null, fileUrl: string): Promise<void> {
    const filter: { must: { key: string; match: { value: string } }[] } = {
      must: [
        { key: "fileUrl", match: { value: fileUrl } },
      ],
    };

    if (userId) {
      filter.must.push({ key: "userId", match: { value: String(userId) } });
    }

    try {
      await qdrantClient.delete(DOCUMENT_COLLECTION_NAME, { filter });
      console.log(`✅ Deleted Qdrant document vectors for fileUrl: ${fileUrl}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error(" Qdrant document delete failed:", e?.message ?? err);
      throw err;
    }
  }

  async deleteDocumentVectorsByContentHash(contentHash: string): Promise<void> {
    const filter = {
      must: [
        { key: "contentHash", match: { value: contentHash } },
      ],
    };

    try {
      await qdrantClient.delete(DOCUMENT_COLLECTION_NAME, { filter });
      console.log(`✅ Deleted Qdrant document vectors for contentHash: ${contentHash}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error(" Qdrant document delete by contentHash failed:", e?.message ?? err);
      throw err;
    }
  }

  async upsertCodeVector(
    id: string,
    codeVector: number[],
    descriptionVector: number[],
    payload: Record<string, unknown>
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const codeContent = (payload.content as any)?.code || "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const descriptionContent = (payload.content as any)?.description || "";

    const codeSparse = textToSparseVector(codeContent);
    const descriptionSparse = textToSparseVector(descriptionContent);

    await qdrantClient.upsert(COLLECTION_NAME, {
      points: [
        {
          id,
          vector: {
            code: codeVector,
            description: descriptionVector,
            "code-sparse": codeSparse,
            "description-sparse": descriptionSparse,
          },
          payload,
        },
      ],
    });
  }

  async upsertSummaryVectors(points: IVectorPoint[]): Promise<void> {
    if (points.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await qdrantClient.upsert(SUMMARY_COLLECTION_NAME, { points: points as any });
  }

  async searchSemanticCache(queryVector: number[], minTimestamp: number): Promise<IVectorSearchResult[]> {
    const results = await qdrantClient.search("search_cache", {
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
    return results.map((r) => ({
      id: String(r.id),
      score: r.score,
      payload: (r.payload ?? {}) as Record<string, unknown>,
    }));
  }

  async upsertSearchCache(id: string, queryVector: number[], payload: Record<string, unknown>): Promise<void> {
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

  async upsertDocumentVectors(points: IVectorPoint[]): Promise<void> {
    if (points.length === 0) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await qdrantClient.upsert(DOCUMENT_COLLECTION_NAME, { points: points as any });
      console.log(`✅ Upserted ${points.length} document vectors to Qdrant`);
    } catch (error: unknown) {
      const e = error as { message?: string };
      console.error(" Failed to upsert document vectors:", e?.message ?? error);
      throw error;
    }
  }

  async searchDocuments(
    queryText: string,
    queryVector: number[],
    contentHashes: string[],
    topK: number = 5
  ): Promise<IVectorSearchResult[]> {
    try {
      if (contentHashes.length === 0) {
        return [];
      }

      const filter = {
        must: [
          {
            key: "sourceType",
            match: { value: "document" },
          },
          {
            key: "contentHash",
            match: { any: contentHashes.map(String) },
          },
        ],
      };

      const sparseVector = textToSparseVector(queryText);
      const limitCandidates = Math.max(topK * 4, 20);

      const response = await qdrantClient.query(DOCUMENT_COLLECTION_NAME, {
        prefetch: [
          {
            using: "dense-vector",
            query: queryVector,
            filter: filter,
            limit: limitCandidates,
            score_threshold: 0.40,
          },
          {
            using: "bm25-vector",
            query: sparseVector,
            filter: filter,
            limit: limitCandidates,
          },
        ],
        query: {
          rrf: {
            fusion: "rrf",
          },
        },
        limit: limitCandidates,
        with_payload: true,
      });

      const candidates: IVectorSearchResult[] = response.points.map((result) => ({
        id: String(result.id),
        score: result.score,
        payload: (result.payload ?? {}) as Record<string, unknown>,
        document: result.payload?.['content'] as Record<string, unknown>,
        metadata: result.payload as Record<string, unknown>,
      }));

      if (candidates.length > 0) {
        try {
          const documentsToRerank = candidates.map((c) => ({
            text: (c.document?.['text'] as string) || "",
            item: c,
          }));

          console.log(`[Reranker] Reranking ${documentsToRerank.length} document candidates using Voyage rerank-2.5-lite`);
          const reranked = await this.rerankerService.rerank(
            queryText,
            documentsToRerank,
            "rerank-2.5-lite"
          );

          if (reranked.length > 0) {
            reranked.sort((a, b) => b.score - a.score);
            const sliced = reranked
              .map((r) => ({
                ...r.document,
                score: r.score,
              }))
              .slice(0, topK);
            
            console.log(`[Reranker] Reranking complete. Top score: ${sliced[0]?.score?.toFixed(4) ?? 0}`);
            return sliced;
          }
        } catch (rerankError: unknown) {
          const e = rerankError as { message?: string };
          console.error("[QdrantVectorRepository] Voyage Rerank failed, falling back to Qdrant RRF ranking:", e.message);
        }
      }

      return candidates.slice(0, topK);
    } catch (error: unknown) {
      const e = error as { message?: string };
      console.error(" Document hybrid search failed:", e?.message ?? error);
      return [];
    }
  }
}
