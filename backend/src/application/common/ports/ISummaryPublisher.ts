export interface ISummaryPublisher {
  publish(summaryOutboxEventId: string, messageToCompress: any[], previousSummary?: string | null): Promise<void>;
}
