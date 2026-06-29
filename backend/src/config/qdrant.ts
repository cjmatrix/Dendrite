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
export const DOCUMENT_COLLECTION_NAME="document_collections"

export async function initQdrant() {
  try {
    const collections = await qdrantClient.getCollections();
    const VOYAGE_DIMENSION = 1024;

    const codeExists = collections.collections.some((c) => c.name === COLLECTION_NAME);
    if (!codeExists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          code: { size: VOYAGE_DIMENSION, distance: "Cosine" },
          description: { size: VOYAGE_DIMENSION, distance: "Cosine" },
        },
        sparse_vectors: {
          "code-sparse": { modifier: "idf" },
          "description-sparse": { modifier: "idf" },
        },
      });
      console.log(`✅ Qdrant collection '${COLLECTION_NAME}' created.`);
    } else {
      console.log(`✅ Qdrant collection '${COLLECTION_NAME}' ready. Updating sparse vectors if missing...`);
      try {
        await qdrantClient.updateCollection(COLLECTION_NAME, {
          sparse_vectors: {
            "code-sparse": { modifier: "idf" },
            "description-sparse": { modifier: "idf" },
          },
        });
      } catch (err) {
        console.log("Sparse vectors might already exist or update failed.");
      }
    }

    const docExists = collections.collections.some((c) => c.name === DOCUMENT_COLLECTION_NAME);
    if (!docExists) {
      await qdrantClient.createCollection(DOCUMENT_COLLECTION_NAME, {
        vectors: {
          "dense-vector": {
            size: VOYAGE_DIMENSION,
            distance: "Cosine",
          },
        },
        sparse_vectors: {
          "bm25-vector": {
            modifier: "idf",
          },
        },
      });
      console.log(`✅ Qdrant collection '${DOCUMENT_COLLECTION_NAME}' created.`);
    } else {
      console.log(`✅ Qdrant collection '${DOCUMENT_COLLECTION_NAME}' ready.`);
    }

    const summaryExists = collections.collections.some((c) => c.name === SUMMARY_COLLECTION_NAME);
    if (!summaryExists) {
      await qdrantClient.createCollection(SUMMARY_COLLECTION_NAME, {
        vectors: { size: VOYAGE_DIMENSION, distance: "Cosine" },
      });
      console.log(`✅ Qdrant collection '${SUMMARY_COLLECTION_NAME}' created.`);
    } else {
      console.log(`✅ Qdrant collection '${SUMMARY_COLLECTION_NAME}' ready.`);
    }

    const searchCacheExists = collections.collections.some((c) => c.name === SEARCH_CACHE_COLLECTION);
    if (!searchCacheExists) {
      await qdrantClient.createCollection(SEARCH_CACHE_COLLECTION, {
        vectors: { size: VOYAGE_DIMENSION, distance: "Cosine" },
      });
      await qdrantClient.createPayloadIndex(SEARCH_CACHE_COLLECTION, {
        field_name: "createdAt",
        field_schema: "integer",
      });
      console.log(`✅ Qdrant collection '${SEARCH_CACHE_COLLECTION}' created.`);
    } else {
      console.log(`✅ Qdrant collection '${SEARCH_CACHE_COLLECTION}' ready.`);
    }

    
    const ensurePayloadIndex = async (collection: string, field: string, schema: "keyword" | "integer") => {
      try {
        await qdrantClient.createPayloadIndex(collection, {
          field_name: field,
          field_schema: schema,
        });
        console.log(`✅ Payload index '${field}' (${schema}) ensured on '${collection}'`);
      } catch (err) {
        
      }
    };

  
    await ensurePayloadIndex(COLLECTION_NAME, "userId", "keyword");
    await ensurePayloadIndex(SUMMARY_COLLECTION_NAME, "userId", "keyword");
    await ensurePayloadIndex(DOCUMENT_COLLECTION_NAME, "userId", "keyword");

   
    await ensurePayloadIndex(COLLECTION_NAME, "chatId", "keyword");
    await ensurePayloadIndex(SUMMARY_COLLECTION_NAME, "chatId", "keyword");
    await ensurePayloadIndex(DOCUMENT_COLLECTION_NAME, "sourceType", "keyword");
    await ensurePayloadIndex(DOCUMENT_COLLECTION_NAME, "contentHash", "keyword");
    await ensurePayloadIndex(DOCUMENT_COLLECTION_NAME, "fileUrl", "keyword");

  } catch (error) {
    console.error("❌ Failed to initialize Qdrant collections:", error);
  }
}
