import { Router } from 'express';
import { authController } from '../controllers/authController';
import { userProtect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', (req, res, next) => authController.register(req, res).catch(next));
router.post('/login', (req, res, next) => authController.login(req, res).catch(next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res).catch(next));
router.post('/logout', (req, res, next) => authController.logout(req, res).catch(next));

router.get('/me', userProtect, (req, res, next) => authController.getMe(req, res).catch(next));
router.post('/fcm-token', userProtect, (req, res, next) => authController.updateFcmToken(req, res).catch(next));

router.post('/send-otp', (req, res, next) => authController.sendOtp(req, res).catch(next));
router.post('/verify-otp', (req, res, next) => authController.verifyOtp(req, res).catch(next));

export default router;
