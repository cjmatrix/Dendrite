import express from 'express';
import { deckController } from '../controllers/deckController';
import { userProtect } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validateRequest';
import {
  CreateDeckInputSchema,
  UpdateDeckInputSchema,
  DeckIdParamSchema,
  MoveCardToDeckInputSchema,
  MoveCardsToDeckInputSchema,
} from '../../application/deck/dtos/deck.dto';

const router = express.Router();

router.use(userProtect);

router.get('/', (req, res, next) => deckController.getDecks(req, res).catch(next));
router.get('/stats', (req, res, next) => deckController.getDeckStats(req, res).catch(next));
router.post('/', validateBody(CreateDeckInputSchema), (req, res, next) => deckController.createDeck(req, res).catch(next));
router.patch('/move-card', validateBody(MoveCardToDeckInputSchema), (req, res, next) => deckController.moveCardToDeck(req, res).catch(next));
router.patch('/move-cards', validateBody(MoveCardsToDeckInputSchema), (req, res, next) => deckController.moveCardsToDeck(req, res).catch(next));
router.patch('/:id', validateParams(DeckIdParamSchema), validateBody(UpdateDeckInputSchema), (req, res, next) => deckController.updateDeck(req, res).catch(next));
router.delete('/:id', validateParams(DeckIdParamSchema), (req, res, next) => deckController.deleteDeck(req, res).catch(next));

export default router;
