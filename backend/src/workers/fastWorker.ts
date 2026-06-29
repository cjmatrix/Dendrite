import "reflect-metadata";
import "../config/di";
import "../config/redis";
import { connectDatabase } from "../infrastructure/database/mongoose";

async function startWorker() {
  try {
    await connectDatabase();

    
    await import("../infrastructure/worker/emailWorker");
    await import("../infrastructure/worker/recallWorker");

    console.log(" Fast Worker Container (Email, Recall) started successfully...");
  } catch (error) {
    console.error("Failed to start Fast Worker Container:", error);
    process.exit(1);
  }
}

startWorker();
