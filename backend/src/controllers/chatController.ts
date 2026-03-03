import { Request, Response } from 'express';
import { createChatService, getChatsService, getChatByIdService, updateChatService, deleteChatService, prepareMessageService, saveModelReply } from '../services/chatService';
import ai from '../config/AIConfig';

export const createChat = async(req: Request, res: Response) => {

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const { title, folderId } = req.body;

    const data = await createChatService(req.user._id.toString(), title, folderId);

    res.status(201).json({
        success: true,
        data
    })
}

export const getChats = async(req: Request, res: Response) => {

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const data = await getChatsService(req.user._id.toString());

    res.status(200).json({
        success: true,
        data
    })
}

export const getChatById = async(req: Request, res: Response) => {

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const id = req.params.id as string;

    const data = await getChatByIdService(id, req.user._id.toString());

    res.status(200).json({
        success: true,
        data
    })
}

export const updateChat = async(req: Request, res: Response) => {

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const id = req.params.id as string;
    const { title, folderId } = req.body;

    const data = await updateChatService(id, req.user._id.toString(), { title, folderId });

    res.status(200).json({
        success: true,
        data
    })
}

export const deleteChat = async(req: Request, res: Response) => {

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const id = req.params.id as string;

    const data = await deleteChatService(id, req.user._id.toString());

    res.status(200).json({
        success: true,
        data
    })
}

export const sendMessage = async(req: Request, res: Response) => {

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const id = req.params.id as string;
    const { message } = req.body;

    if (!message || !message.trim()) {
        res.status(400).json({ message: 'Message is required' });
        return;
    }

    const { contents } = await prepareMessageService(id, req.user._id.toString(), message);


    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents,
    });

    let fullReply = '';
    res.flushHeaders();
    for await (const chunk of stream) {
        const text = chunk.text || '';
        fullReply += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

   
    await saveModelReply(id, req.user._id.toString(), fullReply);

    res.write('data: [DONE]\n\n');
    res.end();
}


