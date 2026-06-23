import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { BaseController } from "../base/BaseController";
import { GetRateLimits } from "../../../application/admin/rateLimit/usecases/GetRateLimits";
import { UpdateRateLimit } from "../../../application/admin/rateLimit/usecases/UpdateRateLimit";

@injectable()
class RateLimitController extends BaseController {
  constructor(
    @inject("GetRateLimits") private getRateLimitsUseCase: GetRateLimits,
    @inject("UpdateRateLimit") private updateRateLimitUseCase: UpdateRateLimit,
  ) {
    super();
  }

  async getRateLimits(req: Request, res: Response): Promise<void> {
    try {
      const limits = await this.getRateLimitsUseCase.execute();
      this.sendSuccess(res, limits, 200, "Rate limits retrieved successfully");
    } catch (err: any) {
      this.sendError(res, err.message || "Failed to retrieve rate limits", err.statusCode || 500);
    }
  }

  async updateRateLimit(req: Request, res: Response): Promise<void> {
    try {
      const key = req.params.key as string;
      const { value } = req.body;

      await this.updateRateLimitUseCase.execute(key, value);

      this.sendSuccess(res, null, 200, `Rate limit ${key} updated successfully and cache invalidated`);
    } catch (err: any) {
      this.sendError(res, err.message || "Failed to update rate limit", err.statusCode || 500);
    }
  }
}

import { container } from "tsyringe";
export const rateLimitController = container.resolve(RateLimitController);
