export interface ISummaryPublisher {
  publish(summaryOutboxEventId: string, messageToCompress: any[]): Promise<void>;
}
