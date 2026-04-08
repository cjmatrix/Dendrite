export interface IOutboxEventRepository {
  findPendingJobs(limit: number, beforeDate: Date): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  updateStatus(id: string, status: string, options?: any): Promise<any>;
  insertMany(events: any[], session?: any): Promise<any[]>;
}
