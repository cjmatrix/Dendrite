import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";
dotenv.config();

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY, 
});

export const COLLECTION_NAME = "code_blocks";
export const SUMMARY_COLLECTION_NAME = "chat_summaries";
export const SEARCH_CACHE_COLLECTION = "search_cache";

export async function initQdrant() {
  try {
    const collections = await qdrantClient.getCollections();

    
    const codeExists = collections.collections.some(
      (c) => c.name === COLLECTION_NAME,
    );
    if (!codeExists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          code: { size:768, distance: "Cosine" },
          description: { size:768, distance: "Cosine" },
        },
      });
      console.log(`✅ Qdrant collection '${COLLECTION_NAME}' created.`);
    } else {
      console.log(`✅ Qdrant collection '${COLLECTION_NAME}' ready.`);
    }


    const summaryExists = collections.collections.some(
      (c) => c.name === SUMMARY_COLLECTION_NAME,
    );
    if (!summaryExists) {
      await qdrantClient.createCollection(SUMMARY_COLLECTION_NAME, {
        vectors: { size: 768, distance: "Cosine" }, 
      });
      console.log(`✅ Qdrant collection '${SUMMARY_COLLECTION_NAME}' created.`);
    } else {
      console.log(`✅ Qdrant collection '${SUMMARY_COLLECTION_NAME}' ready.`);
    }

    const searchCacheExists = collections.collections.some(
      (c) => c.name === SEARCH_CACHE_COLLECTION,
    );
    if (!searchCacheExists) {
     
      await qdrantClient.createCollection(SEARCH_CACHE_COLLECTION, {
        vectors: { size: 768, distance: "Cosine" },
      });
    
      await qdrantClient.createPayloadIndex(SEARCH_CACHE_COLLECTION, {
        field_name: "createdAt",
        field_schema: "integer",
      });
      console.log(`✅ Qdrant collection '${SEARCH_CACHE_COLLECTION}' created.`);
    } else {
      console.log(`✅ Qdrant collection '${SEARCH_CACHE_COLLECTION}' ready.`);
    }
  } catch (error) {
    console.error("❌ Failed to initialize Qdrant collections:", error);
  }
}
