export interface IStatePublisher {
  publish(
    stateOutboxEventId: string,
    messageToCompress: any[],
    previousSummary?: string | null
  ): Promise<void>;
}
