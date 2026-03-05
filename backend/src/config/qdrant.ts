import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";
dotenv.config();

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY, // Optional, depending on your setup
});

export const COLLECTION_NAME = "code_blocks";

// Initialize collection if it doesn't exist
export async function initQdrant() {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === COLLECTION_NAME,
    );

    if (!exists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 3072, // Matches current Gemini API dimensions
          distance: "Cosine",
        },
      });
      console.log(`✅ Qdrant collection '${COLLECTION_NAME}' created.`);
    } else {
      console.log(`✅ Qdrant collection '${COLLECTION_NAME}' ready.`);
    }
  } catch (error) {
    console.error("❌ Failed to initialize Qdrant:", error);
  }
}
