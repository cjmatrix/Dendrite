type EmbeddingTaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "CODE_RETRIEVAL_QUERY"
  | "QUESTION_ANSWERING"
  | "FACT_VERIFICATION"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING";


 import { VoyageAIClient } from "voyageai";

const voyageClient = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});


export async function generateEmbedding(
  text: string,
  taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT",
): Promise<number[]> {

    try {
    const response = await fetch("http://localhost:7997/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "jinaai/jina-embeddings-v2-base-code",
        input: [text],
      }),
    });
    if (!response.ok) {
      throw new Error(`Infinity API responded with status: ${response.status}`);
    }

    const json = await response.json();
    const embedding = json.data?.[0]?.embedding;

    if (!embedding) {
      throw new Error("No embedding returned from Infinity local server");
    }

    return embedding;
  } catch (error: any) {
    console.error("🔥 Jina Local Embedding failed:", error.message);
    throw error;
  }

  // try {
  //   const response = await voyageClient.embed({
  //     input: [text],
  //     model: "voyage-3.5-lite",
  //     inputType: "document"
  //   });

  //   const embedding = response.data?.[0]?.embedding;
  //   if (!embedding || embedding.length === 0) {
  //     throw new Error("No embedding returned from Voyage API");
  //   }

  //   return embedding;
  // } catch (error) {
  //   console.error("Voyage Embedding Error:", error);
  //   throw error;
  // }
}



async function waitAndCheckEngine(retries = 6, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const check = await fetch("http://localhost:7997/models");
      if (check.ok) {
        console.log("✅ [Local AI] Jina v2 Code Embedding Engine is LIVE on port 7997");
        return;
      }
    } catch {
      if (i === 0) console.log("⏳ [Local AI] Waiting for Jina Engine to boot (this takes ~15s)...");
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.log("⚠️ [Local AI] Jina Engine not detected after 30s. Run 'npm run infra:start'");
}

waitAndCheckEngine();
