import express from 'express'
const router = express.Router();
import { createChat, getChats, getChatById, getChatMessages, updateChat, deleteChat, sendMessage } from '../controllers/chatController';
import { userProtect } from '../middleware/authMiddleware';

router.post('/create', userProtect, createChat);
router.get('/', userProtect, getChats);
router.get('/:id', userProtect, getChatById);
router.get('/:id/messages', userProtect, getChatMessages);
router.patch('/:id', userProtect, updateChat);
router.delete('/:id', userProtect, deleteChat);
router.post('/:id/message', userProtect, sendMessage);

export default router

