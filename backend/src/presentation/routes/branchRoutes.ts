import express from 'express';
import { branchController } from '../controllers/branchController';
import { userProtect } from '../middleware/authMiddleware';

const router = express.Router();

router.patch('/inherit/:id', userProtect, (req, res, next) => branchController.inheritContext(req, res).catch(next));
router.patch('/unlink/:id', userProtect, (req, res, next) => branchController.unlinkInheritance(req, res).catch(next));

export default router;