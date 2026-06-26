export interface IDailyTokenUsageRepository {
  upsertUsage(
    userId: string,
    date: Date,
    tier: string,
    increments: Record<string, number>
  ): Promise<void>;
  
  aggregateGlobalUsage(
    startDate: Date,
    endDate: Date,
    tier?: string,
    provider?: string
  ): Promise<Record<string, unknown>[]>;
}
