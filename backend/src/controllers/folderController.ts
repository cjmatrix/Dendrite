import { Request, Response } from 'express';
import { MongoFolderRepository } from '../infrastructure/folder/repositories/MongoFolderRepository';
import { CreateFolder } from '../application/folder/use-cases/CreateFolder';
import { GetFolders } from '../application/folder/use-cases/GetFolders';
import { UpdateFolder } from '../application/folder/use-cases/UpdateFolder';
import { DeleteFolder } from '../application/folder/use-cases/DeleteFolder';
import { QdrantVectorRepository } from '../infrastructure/vector/repositories/QdrantVectorRepository';

const folderRepository = new MongoFolderRepository();

export const createFolder = async(req: Request, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const {name,parentId}=req.body;
    
    const createFolderUseCase = new CreateFolder(folderRepository);
    const data = await createFolderUseCase.execute(req.user._id.toString(), name, parentId);
  
    res.status(201).json({
        success:true,
        data
    })
}

export const getFolders = async(req: Request, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const getFoldersUseCase = new GetFolders(folderRepository);
    const data = await getFoldersUseCase.execute(req.user._id.toString());

    res.status(200).json({
        success: true,
        data
    })
}

export const updateFolder = async(req: Request, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const id = req.params.id as string;
    const { name, isExpanded } = req.body;

    const updateFolderUseCase = new UpdateFolder(folderRepository);
    const data = await updateFolderUseCase.execute(id, req.user._id.toString(), { name, isExpanded });

    res.status(200).json({
        success: true,
        data
    })
}

import { MongoChatRepository } from '../infrastructure/chat/repositories/MongoChatRepository';

export const deleteFolder = async(req: Request, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const id = req.params.id as string;
    const chatRepository = new MongoChatRepository();

    const deleteFolderUseCase = new DeleteFolder(folderRepository, new QdrantVectorRepository(), chatRepository);
    const data = await deleteFolderUseCase.execute(id, req.user._id.toString());

    res.status(200).json({
        success: true,
        data
    })
}