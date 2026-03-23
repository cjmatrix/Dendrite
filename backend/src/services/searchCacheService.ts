import { redisConnection } from "../config/redis";
import { qdrantClient, SEARCH_CACHE_COLLECTION } from "../config/qdrant";
import { generateEmbedding } from "../utils/embedding";
import { tavily } from "@tavily/core";
import { v4 as uuid } from "uuid";


const CACHE_TTL_SECONDS = 12 * 60 * 60;
const SEMANTIC_THRESHOLD = 0.95;

export async function getTavilySearchContext(query: string, precomputedVector?: number[]): Promise<string> {
  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const rawQuery = query.trim();
  

  const normalizedQuery = rawQuery.toLowerCase().replace(/[^\w\s]/gi, "");
  const redisCacheKey = `tavily_search:${normalizedQuery}`;

  const cachedRedisResult = await redisConnection.get(redisCacheKey);
  if (cachedRedisResult) {
    console.log(`[Cache Hit] Redis Exact Match for query: "${query}"`);
    return cachedRedisResult;
  }

  try {
    const queryVector = precomputedVector || await generateEmbedding(rawQuery, "RETRIEVAL_QUERY");
    

    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);

    const semanticResults = await qdrantClient.search(SEARCH_CACHE_COLLECTION, {
      vector: queryVector,
      limit: 1,
      with_payload: true,
      filter: {
        must: [
          {
            key: "createdAt",
            range: { gte: twelveHoursAgo },
          },
        ],
      },
    });

    if (semanticResults.length > 0 && semanticResults[0].score >= SEMANTIC_THRESHOLD) {
      console.log(`[Cache Hit] Qdrant Semantic Match (score: ${semanticResults[0].score.toFixed(3)}) for query: "${query}"`);
      const payloadContent = semanticResults[0].payload?.context as string;
      
   
      await redisConnection.setex(redisCacheKey, CACHE_TTL_SECONDS, payloadContent);
      return payloadContent;
    }

    console.log(`[Cache Miss] Calling Tavily API for query: "${query}"`);

  
    const searchResponse = await tvly.search(rawQuery, {
      searchDepth: "basic",
      maxResults: 3,
    });

    let contextString = "";
    if (searchResponse && searchResponse.results && searchResponse.results.length > 0) {
      contextString = `\n\n--- INTERNET SEARCH RESULTS ---\n${searchResponse.results
        .map((r: any) => `Source: ${r.url}\nContent: ${r.content}`)
        .join("\n\n")}\n--- END SEARCH RESULTS ---\n\nPlease utilize the above internet search results to inform your answer if relevant.`;
    }

    // Only cache if there's actually a meaningful context returned
    if (contextString) {
      // Save to Redis
      await redisConnection.setex(redisCacheKey, CACHE_TTL_SECONDS, contextString);

      // Save to Qdrant Semantic Cache
      await qdrantClient.upsert(SEARCH_CACHE_COLLECTION, {
        points: [
          {
            id: uuid(),
            vector: queryVector, // store the embedding of this query
            payload: {
              context: contextString,
              createdAt: Date.now(),
              originalQuery: rawQuery,
            },
          },
        ],
      });
    }

    return contextString;
  } catch (error) {
    console.error("Failed to fetch or cache Tavily seach results:", error);
    return "";
  }
}
