import "reflect-metadata";
import "../config/di";
import "../config/redis";
import { connectDatabase } from "../infrastructure/database/mongoose";
import { initQdrant } from "../config/qdrant";

async function startWorker() {
  try {
    await connectDatabase();
    await initQdrant();


    await import("../infrastructure/worker/embeddingWorker");
    await import("../infrastructure/worker/descriptionWorker");
    await import("../infrastructure/worker/summaryWorker");

    console.log(" AI Worker Container (Embedding, Description, Summary) started successfully...");
  } catch (error) {
    console.error("Failed to start AI Worker Container:", error);
    process.exit(1);
  }
}

startWorker();
