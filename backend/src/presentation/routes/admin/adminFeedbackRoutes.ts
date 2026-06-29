import express from 'express';
import { adminFeedbackController } from '../../controllers/admin/adminFeedbackController';
import { adminProtect } from '../../middleware/authMiddleware';
import { validateBody, validateParams } from '../../middleware/validateRequest';
import { FeedbackIdParamSchema, UpdateFeedbackStatusSchema } from '../../../application/feedback/dtos/feedback.dto';

const router = express.Router();

router.use(adminProtect);

router.get('/', (req, res, next) => adminFeedbackController.getAllFeedback(req, res).catch(next));
router.put('/:id/status', validateParams(FeedbackIdParamSchema), validateBody(UpdateFeedbackStatusSchema), (req, res, next) => adminFeedbackController.updateStatus(req, res).catch(next));

export default router;
