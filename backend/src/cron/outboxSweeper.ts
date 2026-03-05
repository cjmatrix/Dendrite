import cron from "node-cron";

import { OutboxEvent } from "../models/OutboxEvent";
import embeddingCodeDesc from "../queue/embeddingQueue";

cron.schedule("*/5 * * * *", async () => {
  const ONE_MINUTE_AGO = new Date(Date.now() - 60 * 1000);

  const pendingJobs = await OutboxEvent.find({
    status: { $in: ["pending", "failed"] },
    retryCount:{$lte:10},
    createdAt: { $lt: ONE_MINUTE_AGO },
  }).limit(100);

  console.log(`[Sweeper] Found ${pendingJobs.length} stuck jobs.`);

  for (const job of pendingJobs) {
    try {
      if (job.retryCount >=10) {
        await OutboxEvent.findByIdAndUpdate(job._id, {
          status: "failed",
          error: "Max retries exceeded",
        });

        continue;
      }
      await embeddingCodeDesc(job,job.payload.content)
      await OutboxEvent.findByIdAndUpdate(job._id, { $inc: { retryCount: 1 } });
    } catch (err) {
      console.error(`Sweeper failed for job ${job._id}:`, err);
    }
  }
});
