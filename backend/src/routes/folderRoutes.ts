import express from 'express'
const router=express.Router();
import { createFolder, getFolders, updateFolder, deleteFolder } from '../controllers/folderController';
import { userProtect } from '../middleware/authMiddleware';

router.post('/create', userProtect, createFolder);
router.get('/', userProtect, getFolders);
router.patch('/:id', userProtect, updateFolder);
router.delete('/:id', userProtect, deleteFolder);

export default router