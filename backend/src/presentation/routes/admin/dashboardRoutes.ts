import { Router } from "express";
import { dashboardController } from "../../controllers/admin/dashboardController";
import { adminProtect } from "../../middleware/authMiddleware";

const router = Router();

router.get("/stats", adminProtect, (req, res, next) =>
  dashboardController.getStats(req, res).catch(next)
);

export default router;
