import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { OutboxEvent } from '../models/MongoOutboxEventModel';
import { transactionStorage } from '../../shared/MongooseUnitOfWork';

export class MongoOutboxEventRepository implements IOutboxEventRepository {
  async findPendingJobs(limit: number, beforeDate: Date): Promise<any[]> {
    return OutboxEvent.find({
      status: { $in: ["pending", "failed"] },
      retryCount: { $lte: 10 },
      createdAt: { $lt: beforeDate },
    }).limit(limit);
  }

  async findById(id: string): Promise<any | null> {
    return OutboxEvent.findById(id);
  }

  async updateStatus(id: string, status: string, options: any = {}): Promise<any> {
    const updatePayload: any = { status };
    
    if (status === "processed") {
      updatePayload.processedAt = new Date();
    }
    if (options.error) {
      updatePayload.error = options.error;
    }
    if (options.incrementRetry) {
      updatePayload.$inc = { retryCount: 1 };
    }

    return OutboxEvent.findByIdAndUpdate(id, updatePayload);
  }

  async insertMany(events: any[], session?: any): Promise<any[]> {
    const activeSession = session || transactionStorage.getStore();
    if (activeSession) {
      return OutboxEvent.insertMany(events, { session: activeSession });
    }
    return OutboxEvent.insertMany(events);
  }
}
