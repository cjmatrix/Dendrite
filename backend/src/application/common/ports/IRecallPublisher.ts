export interface IRecallPublisher {
  publish(
    userId: string,
    cardId: string,
    delayInMs: number,
    existingJobId?: string | null
  ): Promise<string | undefined>;
  cancel(jobId: string): Promise<void>;
}
