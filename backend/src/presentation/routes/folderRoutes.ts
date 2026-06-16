import express from 'express';
import { folderController } from '../controllers/folderController';
import { userProtect } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validateRequest';
import {
  CreateFolderInputSchema,
  UpdateFolderInputSchema,
  UpdateFolderBehaviorInputSchema,
  FolderIdParamSchema
} from '../../application/folder/dtos/folder.dto';

const router = express.Router();

router.post(
  '/create',
  userProtect,
  validateBody(CreateFolderInputSchema),
  (req, res, next) => folderController.createFolder(req, res).catch(next)
);

router.get(
  '/',
  userProtect,
  (req, res, next) => folderController.getFolders(req, res).catch(next)
);

router.patch(
  '/:id',
  userProtect,
  validateParams(FolderIdParamSchema),
  validateBody(UpdateFolderInputSchema),
  (req, res, next) => folderController.updateFolder(req, res).catch(next)
);

router.patch(
  '/:id/behavior',
  userProtect,
  validateParams(FolderIdParamSchema),
  validateBody(UpdateFolderBehaviorInputSchema),
  (req, res, next) => folderController.updateBehavior(req, res).catch(next)
);

router.delete(
  '/:id',
  userProtect,
  validateParams(FolderIdParamSchema),
  (req, res, next) => folderController.deleteFolder(req, res).catch(next)
);

router.get(
  '/:id/behavior',
  userProtect,
  validateParams(FolderIdParamSchema),
  (req, res, next) => folderController.getBehaviorOfFolder(req, res).catch(next)
);

export default router;