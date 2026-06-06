import { container } from "tsyringe";
import cron from "node-cron";
import { SweepStrandedBlocks } from "../application/scheduler/use-cases/SweepStrandedBlocks";

cron.schedule("*/5 * * * *", async () => {
  try {
    const sweeperUseCase = container.resolve(SweepStrandedBlocks);
    
    await sweeperUseCase.execute();
  } catch (err) {
    console.error(`[Description Sweeper] failed:`, err);
  }
});
