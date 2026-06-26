import { IOutboxEventRepository, IOutboxEvent } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { OutboxEvent } from '../models/MongoOutboxEventModel';
import { transactionStorage } from '../../shared/MongooseUnitOfWork';

export class MongoOutboxEventRepository implements IOutboxEventRepository {
  async findPendingJobs(limit: number, beforeDate: Date): Promise<IOutboxEvent[]> {
    const docs = await OutboxEvent.find({
      status: { $in: ["pending", "failed"] },
      retryCount: { $lte: 10 },
      createdAt: { $lt: beforeDate },
    }).limit(limit).lean();
    return docs as unknown as IOutboxEvent[];
  }

  async findById(id: string): Promise<IOutboxEvent | null> {
    const doc = await OutboxEvent.findById(id).lean();
    return doc as unknown as IOutboxEvent | null;
  }

  async updateStatus(id: string, status: string, options: { session?: unknown; error?: string; incrementRetry?: boolean } = {}): Promise<IOutboxEvent | null> {
    const updatePayload: Record<string, unknown> = { status };
    
    if (status === "processed") {
      updatePayload.processedAt = new Date();
    }
    if (options.error) {
      updatePayload.error = options.error;
    }
    if (options.incrementRetry) {
      updatePayload.$inc = { retryCount: 1 };
    }

    const doc = await OutboxEvent.findByIdAndUpdate(id, updatePayload).lean();
    return doc as unknown as IOutboxEvent | null;
  }

  async insertMany(events: Partial<IOutboxEvent>[], session?: unknown): Promise<IOutboxEvent[]> {
    const activeSession = session || transactionStorage.getStore();
    let docs;
    if (activeSession) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      docs = await OutboxEvent.insertMany(events, { session: activeSession as any });
    } else {
      docs = await OutboxEvent.insertMany(events);
    }
    return docs as unknown as IOutboxEvent[];
  }
}
