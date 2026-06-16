import express from 'express';
import { branchController } from '../controllers/branchController';
import { userProtect } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validateRequest';
import { InheritContextInputSchema, ChatIdParamSchema } from '../../application/branch/dtos/branch.dto';

const router = express.Router();

router.patch(
  '/inherit/:id',
  userProtect,
  validateParams(ChatIdParamSchema),
  validateBody(InheritContextInputSchema),
  (req, res, next) => branchController.inheritContext(req, res).catch(next)
);

router.patch(
  '/unlink/:id',
  userProtect,
  validateParams(ChatIdParamSchema),
  (req, res, next) => branchController.unlinkInheritance(req, res).catch(next)
);

export default router;