import express from 'express'
const router = express.Router();
import { createChat, getChats, getChatById, getChatMessages, updateChat, deleteChat, sendMessage, streamQuickChat, getSubChat, saveSubChat, uploadChatImage, uploadChatImageMiddleware, uploadChatPdf } from '../controllers/chatController';
import { userProtect } from '../middleware/authMiddleware';

router.post('/create', userProtect, createChat);
router.get('/', userProtect, getChats);
router.get('/:id', userProtect, getChatById);
router.get('/:id/messages', userProtect, getChatMessages);
router.patch('/:id', userProtect, updateChat);
router.delete('/:id', userProtect, deleteChat);
router.post('/upload-image', userProtect, uploadChatImageMiddleware, uploadChatImage);
router.post('/upload-file', userProtect, uploadChatPdf);
router.post('/upload-pdf', userProtect, uploadChatPdf);
router.post('/:id/message', userProtect, sendMessage);
router.post('/:id/quick-chat', userProtect, streamQuickChat);
router.get('/:id/subchat', userProtect, getSubChat);
router.post('/:id/subchat', userProtect, saveSubChat);

export default router

