export interface IMetricsService {
  incrementAICall(status: "success" | "failure", model: string,task:"main"|"sub"|"summary"|"code"): void;
  recordHttpRequestDuration(method: string, route: string, statusCode: string | number, durationSeconds: number): void;
  getMetrics(): Promise<string>;
  getContentType(): string;
}
