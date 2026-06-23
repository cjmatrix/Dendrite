import { Router } from "express";
import { rateLimitController } from "../../controllers/admin/rateLimitController";
import { adminProtect } from "../../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  adminProtect,
  (req, res, next) => rateLimitController.getRateLimits(req, res).catch(next)
);

router.put(
  "/:key",
  adminProtect,
  (req, res, next) => rateLimitController.updateRateLimit(req, res).catch(next)
);

export default router;
