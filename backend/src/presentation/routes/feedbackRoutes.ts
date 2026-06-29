import express from 'express';
import { feedbackController } from '../controllers/feedbackController';
import { userProtect } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateRequest';
import { CreateFeedbackInputSchema } from '../../application/feedback/dtos/feedback.dto';

const router = express.Router();

router.use(userProtect);

router.post('/', validateBody(CreateFeedbackInputSchema), (req, res, next) => feedbackController.createFeedback(req, res).catch(next));

export default router;
