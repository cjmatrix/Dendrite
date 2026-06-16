export interface IActiveUserTracker {
  trackActive(identifier: string): Promise<void>;
  getActiveCount(): Promise<number>;
}
