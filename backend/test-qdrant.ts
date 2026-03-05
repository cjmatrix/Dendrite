import { qdrantClient } from "./src/config/qdrant";

async function test() {
  try {
    const res = await qdrantClient.search("code_blocks", {
      vector: new Array(768).fill(0.1),
      limit: 3,
      filter: {
        must: [{ key: "userId", match: { value: "some_id" } }],
      },
    });
    console.log("Success:", res);
  } catch (e: any) {
    console.error("Search failed:", e);
    console.error(
      "Response:",
      e.response?.data || e.data || e.body || e.context,
    );
  }

  try {
    const upsertRes = await qdrantClient.upsert("code_blocks", {
      points: [
        {
          id: "69a851486b4b4b9d9ae2642f",
          vector: new Array(768).fill(0.1),
          payload: { test: true },
        },
      ],
    });
    console.log("Upsert success:", upsertRes);
  } catch (e: any) {
    console.error("Upsert failed:", e);
    console.error(
      "Response:",
      e.response?.data || e.data || e.body || e.context,
    );
  }
}

test();
