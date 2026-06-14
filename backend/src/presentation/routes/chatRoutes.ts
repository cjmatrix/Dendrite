import express from 'express';
import { chatController } from '../controllers/chatController';
import { userProtect } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateRequest';
import {
  CreateChatBodySchema,
  UpdateChatBodySchema,
  SendMessageBodySchema,
  StreamQuickChatBodySchema,
  SaveSubChatBodySchema,
} from '../../application/chat/dtos/chat.dto';

import { uploadPdfMiddleware } from '../middleware/uploadPdfMiddleware';

const router = express.Router();

router.post('/create', userProtect, validateBody(CreateChatBodySchema), (req, res, next) => chatController.createChat(req, res).catch(next));
router.get('/', userProtect, (req, res, next) => chatController.getChats(req, res).catch(next));
router.get('/:id', userProtect, (req, res, next) => chatController.getChatById(req, res).catch(next));
router.get('/:id/messages', userProtect, (req, res, next) => chatController.getChatMessages(req, res).catch(next));
router.patch('/:id', userProtect, validateBody(UpdateChatBodySchema), (req, res, next) => chatController.updateChat(req, res).catch(next));
router.delete('/:id', userProtect, (req, res, next) => chatController.deleteChat(req, res).catch(next));

router.post('/upload-image', userProtect, chatController.uploadChatImageMiddleware, (req, res, next) => chatController.uploadChatImage(req, res).catch(next));
router.post('/:id/upload-file', userProtect, uploadPdfMiddleware, (req, res, next) => chatController.uploadChatPdf(req, res).catch(next));
router.get('/:id/documents/:documentId/progress', userProtect, (req, res, next) => chatController.streamDocumentProgress(req, res).catch(next));
router.get('/:id/documents', userProtect, (req, res, next) => chatController.getChatDocuments(req, res).catch(next));
router.delete('/:id/documents', userProtect, (req, res, next) => chatController.removeDocument(req, res).catch(next));

router.post('/:id/message', userProtect, validateBody(SendMessageBodySchema), (req, res, next) => chatController.sendMessage(req, res).catch(next));
router.post('/:id/quick-chat', userProtect, validateBody(StreamQuickChatBodySchema), (req, res, next) => chatController.streamQuickChat(req, res).catch(next));
router.get('/:id/subchat', userProtect, (req, res, next) => chatController.getSubChat(req, res).catch(next));
router.post('/:id/subchat', userProtect, validateBody(SaveSubChatBodySchema), (req, res, next) => chatController.saveSubChat(req, res).catch(next));

export default router;