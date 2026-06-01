import cron from "node-cron";
import embeddingCodeDesc from "../queue/embeddingQueue";
import addSummaryQueue from "../queue/summaryQueue";
import { MongoOutboxEventRepository } from "../infrastructure/outbox/repositories/MongoOutboxEventRepository";
import { SweepPendingOutbox } from "../application/scheduler/use-cases/SweepPendingOutbox";

cron.schedule("*/1 * * * *", async () => {
  const outboxRepo = new MongoOutboxEventRepository();
  const sweepOutboxUseCase = new SweepPendingOutbox(outboxRepo, {
    embeddingCodeDesc,
    addSummaryQueue,
  });

  await sweepOutboxUseCase.execute();
});
