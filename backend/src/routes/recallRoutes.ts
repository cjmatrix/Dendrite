import express from 'express'
import { creatingCard, updatingCard, gettingDueCards, deletingCard, clearingCards, countingCards } from '../controllers/recallController';
import { userProtect } from '../middleware/authMiddleware';

const router=express.Router();

router.use(userProtect);

router.post("/save",creatingCard)
router.post("/update/:id",updatingCard)
router.get("/count", countingCards)
router.get("/", gettingDueCards)
router.delete("/clear", clearingCards)
router.delete("/:id", deletingCard)

export default router