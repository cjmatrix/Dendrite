import { Router } from "express";
import { billingController } from "../controllers/billingController";
import { userProtect } from "../middleware/authMiddleware";
import express from "express";

const router = Router();

router.post("/webhook", express.raw({ type: "application/json" }), (req, res, next) => billingController.handleWebhook(req, res).catch(next));


router.post("/checkout-session", express.json(), userProtect, (req, res, next) => billingController.createCheckoutSession(req, res).catch(next));
router.post("/portal-session", express.json(), userProtect, (req, res, next) => billingController.createPortalSession(req, res).catch(next));

export default router;
