import ai from "./src/config/AIConfig";

async function testDims() {
  const result = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: ["hello world"],
    config: { taskType: "RETRIEVAL_DOCUMENT" },
  });
  console.log(
    "Vector dimensions from text-embedding-004:",
    result.embeddings?.[0]?.values?.length,
  );

  const result2 = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: ["hello world"],
    config: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: 768 },
  });
  console.log(
    "Vector dimensions with outputDimensionality:",
    result2.embeddings?.[0]?.values?.length,
  );
}
testDims();
