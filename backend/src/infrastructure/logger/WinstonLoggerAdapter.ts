import winston from "winston";
import LokiTransport from "winston-loki";
import { ILogger } from "../../application/common/ports/ILogger";


export class WinstonLoggerAdapter implements ILogger {
  private logger: winston.Logger;

  constructor(serviceName: string = "Dentrites") {
    this.logger = winston.createLogger({
      defaultMeta: { service: serviceName },
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
              return `[${timestamp}] ${level}: ${message} ${metaStr}`;
            })
          ),
        }),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          format: winston.format.json(),
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
          format: winston.format.json(),
        }),
        new LokiTransport({
          host: process.env.LOKI_URL || "http://localhost:3100",
          labels: { app: "dentrites", service: serviceName },
          json: true,
          format: winston.format.json(),
          replaceTimestamp: true,
          onConnectionError: (err: Error) => console.error("Loki connection error:", err)
        }),
      ],
    });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    if (error instanceof Error) {
      this.logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      this.logger.error(message, { error, ...meta });
    }
  }
}

export const createLogger = (serviceName?: string): ILogger => {
  return new WinstonLoggerAdapter(serviceName);
};
