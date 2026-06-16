import express from 'express';
import { recallController } from '../controllers/recallController';
import { userProtect } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validateRequest';
import { CreateCardInputSchema, UpdateCardInputSchema, CardIdParamSchema } from '../../application/recall/dtos/recall.dto';

const router = express.Router();

router.use(userProtect);

router.post('/save', validateBody(CreateCardInputSchema), (req, res, next) => recallController.createCard(req, res).catch(next));
router.post('/update/:id', validateParams(CardIdParamSchema), validateBody(UpdateCardInputSchema), (req, res, next) => recallController.updateCard(req, res).catch(next));
router.get('/count', (req, res, next) => recallController.countDueCards(req, res).catch(next));
router.get('/', (req, res, next) => recallController.getDueCards(req, res).catch(next));
router.delete('/clear', (req, res, next) => recallController.clearAllCards(req, res).catch(next));
router.delete('/:id', validateParams(CardIdParamSchema), (req, res, next) => recallController.deleteCard(req, res).catch(next));

export default router;