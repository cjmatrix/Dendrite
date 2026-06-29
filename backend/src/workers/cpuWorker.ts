import "reflect-metadata";
import "../config/di";
import "../config/redis";
import { connectDatabase } from "../infrastructure/database/mongoose";

async function startWorker() {
  try {
    await connectDatabase();

    
    await import("../infrastructure/worker/documentChunkingWorker");

    console.log(" CPU Worker Container (Document Chunking) started successfully...");
  } catch (error) {
    console.error("Failed to start CPU Worker Container:", error);
    process.exit(1);
  }
}

startWorker();
