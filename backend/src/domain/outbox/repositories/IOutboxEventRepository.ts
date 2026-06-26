export interface IOutboxEvent {
  _id: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: string;
  retryCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOutboxEventRepository {
  findPendingJobs(limit: number, beforeDate: Date): Promise<IOutboxEvent[]>;
  findById(id: string): Promise<IOutboxEvent | null>;
  updateStatus(id: string, status: string, options?: { session?: unknown, error?: string, incrementRetry?: boolean }): Promise<IOutboxEvent | null>;
  insertMany(events: Partial<IOutboxEvent>[], session?: unknown): Promise<IOutboxEvent[]>;
}
