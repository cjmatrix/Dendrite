import { generateEmbedding } from "./src/utils/embedding";

async function testDims() {
  const result = await generateEmbedding("hello world");
  console.log("Vector dimensions from Gemini:", result.length);
}
testDims();
