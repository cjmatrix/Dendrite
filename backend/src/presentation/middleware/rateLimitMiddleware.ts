import { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import { IRateLimitService } from "../../application/common/ports/IRateLimitService";
import { CountLimitCategory, UserTier } from "../../constants/rateLimits";
import { DEFAULT_MODEL } from "../../constants/models";



function formatTimeRemaining(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}


export function rateLimit(category: CountLimitCategory) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user?._id) return next();

      const tier = (user.tier || "free") as UserTier;
      const rateLimitService = container.resolve<IRateLimitService>("IRateLimitService");

      const result = await rateLimitService.checkCountLimit(
        user._id.toString(),
        tier,
        category,
      );

      if (!result.allowed) {
        const resetStr = formatTimeRemaining(result.resetsInSeconds);
        return res.status(429).json({
          error: `Daily ${category} limit reached (${result.limit}/${result.limit}). Resets in ${resetStr}.`,
          category,
          current: result.current,
          limit: result.limit,
          resetsInSeconds: result.resetsInSeconds,
        });
      }

      next();
    } catch (err) {
    
      console.error("[RateLimit] Redis check failed, allowing request:", err);
      next();
    }
  };
}


export function rateLimitTokens() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user?._id) return next();

      const tier = (user.tier || "free") as UserTier;
      const rateLimitService = container.resolve<IRateLimitService>("IRateLimitService");

     
      let modelId = req.body?.model;
      if (!modelId || modelId === "DEFAULT") {
        modelId = DEFAULT_MODEL;
      }

      const result = await rateLimitService.checkTokenLimit(
        user._id.toString(),
        tier,
        modelId,
      );

      if (!result.allowed) {
        if (result.limit === 0) {
          return res.status(429).json({
            error: `Model "${modelId}" is not available on the ${tier} plan. Please upgrade your plan.`,
            category: "tokens",
            model: modelId,
            current: result.current,
            limit: result.limit,
          });
        }

        const resetStr = formatTimeRemaining(result.resetsInSeconds);
        return res.status(429).json({
          error: `Daily token limit for "${modelId}" reached (${result.current.toLocaleString()}/${result.limit.toLocaleString()} tokens). Resets in ${resetStr}.`,
          category: "tokens",
          model: modelId,
          current: result.current,
          limit: result.limit,
          resetsInSeconds: result.resetsInSeconds,
        });
      }

      next();
    } catch (err) {
     
      console.error(
        "[RateLimitTokens] Redis check failed, allowing request:",
        err,
      );
      next();
    }
  };
}
