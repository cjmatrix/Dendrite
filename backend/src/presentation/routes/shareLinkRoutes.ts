import { Router } from "express";
import { shareLinkController } from "../controllers/shareLinkController";
import { userProtect } from "../middleware/authMiddleware";

const router = Router();

router.post("/", userProtect, (req, res, next) => shareLinkController.createLink(req, res).catch(next));
router.get("/resolve/:token", (req, res, next) => shareLinkController.resolveLink(req, res).catch(next));

export default router;