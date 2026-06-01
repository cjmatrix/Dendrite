import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';

export class SweepPendingOutbox {
  constructor(
    private outboxRepository: IOutboxEventRepository,
    private queueFunctions: {
      embeddingCodeDesc: (job: any, content: any) => Promise<void>;
      addSummaryQueue: (id: string, messages: any, previousSummary: any) => Promise<void>;
    }
  ) {}

  async execute() {
    const ONE_MINUTE_AGO = new Date(Date.now() - 60 * 1000);

    const pendingJobs = await this.outboxRepository.findPendingJobs(100, ONE_MINUTE_AGO);

    if (pendingJobs.length > 0) {
      console.log(`[Sweeper] Found ${pendingJobs.length} stuck jobs.`);
    }

    for (const job of pendingJobs) {
      try {
        if (job.retryCount >= 10) {
          await this.outboxRepository.updateStatus(job._id, "failed", { error: "Max retries exceeded" });
          continue;
        }

        if (job.eventType === "CODE_BLOCK_CREATED") {
          await this.queueFunctions.embeddingCodeDesc(job, job.payload.content);
        } else if (job.eventType === "CHAT_SUMMARY_CREATED") {
          await this.queueFunctions.addSummaryQueue(
            job._id.toString(),
            job.payload.content.messages,
            job.payload.metadata?.previousSummary,
          );
        }

        await this.outboxRepository.updateStatus(job._id, "pending", { incrementRetry: true });
      } catch (err) {
        console.error(`Sweeper failed for job ${job._id}:`, err);
      }
    }
  }
}
