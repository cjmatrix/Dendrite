import { qdrantClient, COLLECTION_NAME } from "../config/qdrant";
import { generateEmbedding } from "../utils/embedding";

// Similarity threshold - adjust based on testing (0.6 to 0.8 is usually good)
const SIMILARITY_THRESHOLD = 0.7;

export async function searchSimilarCode(
  query: string,
  userId: string,
  chatId: string,
  topK: number = 3,
) {
  try {
    const queryVector = await generateEmbedding(query, "CODE_RETRIEVAL_QUERY");
    // console.log(queryVector)
    const searchResults = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: topK,
      filter: {
        must: [
          {
            key: "userId",
            match: { value: String(userId) },
          },
          {
            key: "chatId",
            match: { value: String(chatId) },
          },
        ],
      },
      with_payload: true,
    });

    const relevantResults = searchResults.filter(
      (result) => result.score >= SIMILARITY_THRESHOLD,
    );
    // console.log(relevantResults);

 

    return relevantResults.map((result) => ({
      score: result.score,
      codeBlockId: result.id,
      content: result.payload?.content as string,
      language: result.payload?.language as string,
      chatId: result.payload?.chatId as string,
    }));
  } catch (error: any) {
    const errorDetails = error.data || error.response?.data || error.message;
    console.error("❌ Qdrant search failed:", errorDetails);
    return [];
  }
}
