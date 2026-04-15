import express from 'express';
import { chatController } from '../controllers/chatController';
import { userProtect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/create', userProtect, (req, res, next) => chatController.createChat(req, res).catch(next));
router.get('/', userProtect, (req, res, next) => chatController.getChats(req, res).catch(next));
router.get('/:id', userProtect, (req, res, next) => chatController.getChatById(req, res).catch(next));
router.get('/:id/messages', userProtect, (req, res, next) => chatController.getChatMessages(req, res).catch(next));
router.patch('/:id', userProtect, (req, res, next) => chatController.updateChat(req, res).catch(next));
router.delete('/:id', userProtect, (req, res, next) => chatController.deleteChat(req, res).catch(next));

router.post('/upload-image', userProtect, chatController.uploadChatImageMiddleware, (req, res, next) => chatController.uploadChatImage(req, res).catch(next));
router.post('/upload-file', userProtect, (req, res, next) => chatController.uploadChatPdf(req, res).catch(next));
router.post('/upload-pdf', userProtect, (req, res, next) => chatController.uploadChatPdf(req, res).catch(next));

router.post('/:id/message', userProtect, (req, res, next) => chatController.sendMessage(req, res).catch(next));
router.post('/:id/quick-chat', userProtect, (req, res, next) => chatController.streamQuickChat(req, res).catch(next));
router.get('/:id/subchat', userProtect, (req, res, next) => chatController.getSubChat(req, res).catch(next));
router.post('/:id/subchat', userProtect, (req, res, next) => chatController.saveSubChat(req, res).catch(next));

export default router;