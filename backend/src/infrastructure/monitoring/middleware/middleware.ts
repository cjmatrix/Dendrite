import { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import { IMetricsService } from "../../../application/common/ports/IMetricsService";

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    
    try {
      const metricsService = container.resolve<IMetricsService>("IMetricsService");
      const route = req.route ? req.route.path : req.path;
      metricsService.recordHttpRequestDuration(req.method, route, res.statusCode, durationSeconds);
    } catch (err) {
      console.error("Failed to record metrics:", err);
    }
  });

  next();
};