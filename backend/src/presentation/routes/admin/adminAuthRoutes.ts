import express from "express";
import { adminAuthController } from "../../controllers/admin/adminAuthController";
import { adminProtect } from "../../middleware/authMiddleware";
import { AdminLoginInputSchema } from "../../../application/admin/adminAuth/dtos/admin.dto";
import { validateBody } from "../../middleware/validateRequest";

const router = express.Router();

router.post(
	"/login",
	validateBody(AdminLoginInputSchema),
	(req, res, next) => adminAuthController.login(req, res).catch(next),
);
router.post(
	"/refresh",
	(req, res, next) => adminAuthController.refresh(req, res).catch(next),
);
router.post("/logout", (req, res, next) => adminAuthController.logout(req, res).catch(next));
router.get("/me", adminProtect, (req, res, next) => adminAuthController.getMe(req, res).catch(next));

export default router;
