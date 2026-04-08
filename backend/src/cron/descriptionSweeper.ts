import cron from "node-cron";
import addDescriptionQueue from "../queue/descriptionQueue";
import { MongoCodeBlockRepository } from "../infrastructure/chat/repositories/MongoCodeBlockRepository";
import { SweepStrandedBlocks } from "../application/scheduler/use-cases/SweepStrandedBlocks";

cron.schedule("*/10 * * * *", async () => {
  try {
    const codeBlockRepo = new MongoCodeBlockRepository();
    const sweeperUseCase = new SweepStrandedBlocks(codeBlockRepo, addDescriptionQueue);
    
    await sweeperUseCase.execute();
  } catch (err) {
    console.error(`[Description Sweeper] failed:`, err);
  }
});
