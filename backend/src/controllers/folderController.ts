import { Request, Response } from 'express';
import { createFolderService, getFoldersService, updateFolderService, deleteFolderService } from '../services/folderService';
export const createFolder = async(req: Request, res: Response) => {

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const {name,parentId}=req.body;

    const data= await createFolderService(req.user._id.toString(),name,parentId)
  
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

    const data = await getFoldersService(req.user._id.toString());

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

    const data = await updateFolderService(id, req.user._id.toString(), { name, isExpanded });

    res.status(200).json({
        success: true,
        data
    })
}

export const deleteFolder = async(req: Request, res: Response) => {

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const id = req.params.id as string;

    const data = await deleteFolderService(id, req.user._id.toString());

    res.status(200).json({
        success: true,
        data
    })
}