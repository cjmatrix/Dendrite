import { Router } from "express";
import { dashboardController } from "../../controllers/admin/dashboardController";
import { adminProtect } from "../../middleware/authMiddleware";

const router = Router();

router.get("/stats", adminProtect, (req, res, next) =>
  dashboardController.getStats(req, res).catch(next)
);

router.get("/subscription-stats", adminProtect, (req, res, next) =>
  dashboardController.getSubscriptionStats(req, res).catch(next)
);

router.get("/health", adminProtect, (req, res, next) =>
  dashboardController.getHealth(req, res).catch(next)
);

export default router;
