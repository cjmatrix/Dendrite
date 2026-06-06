import { container } from "tsyringe";
import cron from "node-cron";
import { SweepPendingOutbox } from "../application/scheduler/use-cases/SweepPendingOutbox";

cron.schedule("*/1 * * * *", async () => {
  try {
    const sweepOutboxUseCase = container.resolve(SweepPendingOutbox);
    await sweepOutboxUseCase.execute();
  } catch (err) {
    console.error(`[Outbox Sweeper] failed:`, err);
  }
});
