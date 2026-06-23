import { Router } from "express";
import { authController } from "../controllers/authController";
import { userProtect } from "../middleware/authMiddleware";
import {
	GoogleLoginInputSchema,
	LoginInputSchema,
	RegisterInputSchema,
	SendOtpInputSchema,
	UpdateFcmTokenInputSchema,
	VerifyOtpInputSchema,
	ForgotPasswordInputSchema,
	ResetPasswordInputSchema,
} from "../../application/auth/dtos/auth.dto";
import {
	validateBody,
	validatePasswordConfirmation,
} from "../middleware/validateRequest";

const router = Router();

router.post(
	"/register",
	validatePasswordConfirmation,
	validateBody(RegisterInputSchema),
	(req, res, next) => authController.register(req, res).catch(next),
);
router.post(
	"/login",
	validateBody(LoginInputSchema),
	(req, res, next) => authController.login(req, res).catch(next),
);
router.post("/refresh", (req, res, next) => authController.refresh(req, res).catch(next));
router.post("/logout", (req, res, next) => authController.logout(req, res).catch(next));

router.get("/me", userProtect, (req, res, next) => authController.getMe(req, res).catch(next));
router.get("/me/usage", userProtect, (req, res, next) => authController.getRateLimitUsage(req, res).catch(next));
router.get("/me/byok-keys", userProtect, (req, res, next) => authController.getByokKeys(req, res).catch(next));
router.post("/me/byok-keys", userProtect, (req, res, next) => authController.updateByokKeys(req, res).catch(next));
router.post(
	"/fcm-token",
	userProtect,
	validateBody(UpdateFcmTokenInputSchema.omit({ userId: true })),
	(req, res, next) => authController.updateFcmToken(req, res).catch(next),
);

router.post(
	"/send-otp",
	validateBody(SendOtpInputSchema),
	(req, res, next) => authController.sendOtp(req, res).catch(next),
);
router.post(
	"/verify-otp",
	validateBody(VerifyOtpInputSchema),
	(req, res, next) => authController.verifyOtp(req, res).catch(next),
);
router.post(
	"/google",
	validateBody(GoogleLoginInputSchema),
	(req, res, next) => authController.googleLogin(req, res).catch(next),
);

router.post(
	"/forgot-password",
	validateBody(ForgotPasswordInputSchema),
	(req, res, next) => authController.forgotPassword(req, res).catch(next),
);

router.post(
	"/reset-password",
	validateBody(ResetPasswordInputSchema),
	(req, res, next) => authController.resetPassword(req, res).catch(next),
);

export default router;
