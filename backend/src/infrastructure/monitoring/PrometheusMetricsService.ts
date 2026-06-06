import { injectable } from "tsyringe";
import client from "prom-client";
import { IMetricsService } from "../../application/common/ports/IMetricsService";

@injectable()
export class PrometheusMetricsService implements IMetricsService {
  private readonly register: client.Registry;
  private readonly aiCallCounter: client.Counter;
  private readonly httpRequestDuration: client.Histogram;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    this.aiCallCounter = new client.Counter({
      name: "gemini_api_calls_total",
      help: "Total Gemini API calls made",
      labelNames: ["status", "model","task"],
    });
    this.register.registerMetric(this.aiCallCounter);

    this.httpRequestDuration = new client.Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.1, 0.5, 1, 2, 5],
    });
    this.register.registerMetric(this.httpRequestDuration);
  }

  public incrementAICall(status: "success" | "failure", model: string, task: "main"|"sub"|"summary"|"code" ): void {
    this.aiCallCounter.inc({ status, model,task });
  }

  public recordHttpRequestDuration(
    method: string,
    route: string,
    statusCode: string | number,
    durationSeconds: number
  ): void {
    this.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: String(statusCode),
      },
      durationSeconds
    );
  }

  public async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  public getContentType(): string {
    return this.register.contentType;
  }
}
