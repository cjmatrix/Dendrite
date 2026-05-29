import { Router } from "express";
import { userController } from "../../controllers/admin/userController";
import { adminProtect } from "../../middleware/authMiddleware";
import {
	FindAllUsersInputSchema,
	GetUserDetailsInputSchema,
	SuspendUserInputSchema,
} from "../../../application/admin/user/dtos/userManagement.dto";
import {
	validateBody,
	validateParams,
	validateQuery,
} from "../../middleware/validateRequest";

const router=Router();


router.get(
	"/",
	adminProtect,
	validateQuery(FindAllUsersInputSchema),
	(req, res, next) => userController.findAll(req, res).catch(next),
);
router.get(
	"/:id",
	adminProtect,
	validateParams(GetUserDetailsInputSchema),
	(req, res, next) => userController.findById(req, res).catch(next),
);
router.post(
	"/:id/suspend",
	adminProtect,
	validateParams(GetUserDetailsInputSchema),
	validateBody(SuspendUserInputSchema.omit({ userId: true })),
	(req, res, next) => userController.suspend(req, res).catch(next),
);
router.post(
	"/:id/unsuspend",
	adminProtect,
	validateParams(GetUserDetailsInputSchema),
	(req, res, next) => userController.unsuspend(req, res).catch(next),
);
router.post(
	"/:id/toggle-ban",
	adminProtect,
	validateParams(GetUserDetailsInputSchema),
	(req, res, next) => userController.toggleBan(req, res).catch(next),
);


export default router