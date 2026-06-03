import express from 'express';
import { folderController } from '../controllers/folderController';
import { userProtect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/create', userProtect, (req, res, next) => folderController.createFolder(req, res).catch(next));
router.get('/', userProtect, (req, res, next) => folderController.getFolders(req, res).catch(next));
router.patch('/:id', userProtect, (req, res, next) => folderController.updateFolder(req, res).catch(next));
router.patch('/:id/behavior', userProtect, (req, res, next) => folderController.updateBehavior(req, res).catch(next));
router.delete('/:id', userProtect, (req, res, next) => folderController.deleteFolder(req, res).catch(next));
router.get('/:id/behavior',userProtect,(req,res,next)=>folderController.getBehaviorOfFolder(req,res).catch(next))

export default router;