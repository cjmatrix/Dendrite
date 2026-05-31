export interface IDescriptionPublisher {
  publish(blocks: any[]): Promise<void>;
}
