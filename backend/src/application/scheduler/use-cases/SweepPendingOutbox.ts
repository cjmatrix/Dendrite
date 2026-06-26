import { injectable, inject } from "tsyringe";
import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { IEmbeddingPublisher } from '../../common/ports/IEmbeddingPublisher';
import { ISummaryPublisher } from '../../common/ports/ISummaryPublisher';

@injectable()
export class SweepPendingOutbox {
  constructor(
    @inject("IOutboxEventRepository") private outboxRepository: IOutboxEventRepository,
    @inject("IEmbeddingPublisher") private embeddingPublisher: IEmbeddingPublisher,
    @inject("ISummaryPublisher") private summaryPublisher: ISummaryPublisher
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
          await this.embeddingPublisher.publish(job._id.toString(), job.payload.content as Record<string, unknown>);
        } else if (job.eventType === "CHAT_SUMMARY_CREATED") {
          await this.summaryPublisher.publish(
            job._id.toString(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (job.payload.content as { messages: any[] }).messages,
            ((job.payload.metadata || {}) as Record<string, string>).previousSummary,
          );
        }

        await this.outboxRepository.updateStatus(job._id, "pending", { incrementRetry: true });
      } catch (err) {
        console.error(`Sweeper failed for job ${job._id}:`, err);
      }
    }
  }
}
