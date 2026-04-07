import {
  qdrantClient,
  COLLECTION_NAME,
  SUMMARY_COLLECTION_NAME,
} from "../config/qdrant";
import { generateEmbedding } from "../utils/embedding";

// Similarity threshold for filtering Qdrant results (Cosine similarity).
// Configurable via environment variable `SIMILARITY_THRESHOLD` (e.g. 0.75).
const SIMILARITY_THRESHOLD = 0.62;

export async function searchSimilarCode(
  codeQueryVector: number[],
  descQueryVector: number[],
  userId: string,
  chatIds: string[],
  topK: number = 3,
) {
  try {
    // console.log(queryVector)

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
    console.log(JSON.stringify(codeResults,null,2),JSON.stringify(descriptionResults,null,2))
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

    // const searchResults = await qdrantClient.search(COLLECTION_NAME, {
    //   vector: queryVector,
    //   limit: topK,
    //   filter: {
    //     must: [
    //       {
    //         key: "userId",
    //         match: { value: String(userId) },
    //       },
    //       {
    //         key: "chatId",
    //         match: { value: String(chatId) },
    //       },
    //     ],
    //   },
    //   with_payload: true,
    // });

    // const relevantResults = searchResults.filter(
    //   (result) => result.score >= SIMILARITY_THRESHOLD,
    // );
    // // console.log(relevantResults);

    // return relevantResults.map((result) => ({
    //   score: result.score,
    //   codeBlockId: result.id,
    //   content: result.payload?.content as string,
    //   language: result.payload?.language as string,
    //   chatId: result.payload?.chatId as string,
    // }));
  } catch (error: any) {
    const errorDetails = error.data || error.response?.data || error.message;
    console.error("❌ Qdrant search failed:", errorDetails);
    return [];
  }
}

export async function searchSimiliarChatChunk(
  chunkQueryVector: number[],
  userId: string,
  chatIds: string[],
  topK: number = 5,
) {
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
    console.log(JSON.stringify(searchResults,null,2))
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
