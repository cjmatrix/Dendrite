import { qdrantClient, COLLECTION_NAME } from "./src/config/qdrant";

async function resetCollection() {
  console.log(`Deleting collection: ${COLLECTION_NAME}...`);
  await qdrantClient.deleteCollection(COLLECTION_NAME);
  console.log(
    `Deleted! The server will auto-create it with 3072 dimensions on next restart.`,
  );
}

resetCollection();
