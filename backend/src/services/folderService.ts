
import { Folder } from "../models/Folders"
import { Chat } from "../models/Chat"
import { AppError } from "../utils/AppError"
export const createFolderService = async(userId: string, name: string,parentId:string|null) => {

    const folder= await Folder.findOne({userId:userId,name:name,parentId:parentId});
    if(folder){
        throw new AppError("Folder Already Exist",400);
    }

    const newFolder= await Folder.create({userId,name,parentId});
    return newFolder

}

export const getFoldersService = async(userId: string) => {

    const folders = await Folder.find({ userId }).sort({ createdAt: 1 }).lean();


    const folderMap = new Map();
    const roots=[];


    for (const folder of folders) {
        folderMap.set(folder._id.toString(), {
            id: folder._id,
            name: folder.name,
            type: 'folder',
            parentId: folder.parentId,
            children: [],
            isExpanded: folder.isExpanded,
            isSystemFolder: folder.isSystemFolder
        });
    }

   
    for (const folder of folders) {
        const node = folderMap.get(folder._id.toString());
        if (folder.parentId) {
            const parent = folderMap.get(folder.parentId.toString());
            if (parent) {
                parent.children.push(node);
            }
        } else {
            roots.push(node);
        }
    }

    return roots;
}

export const updateFolderService = async(folderId: string, userId: string, updates: { name?: string, isExpanded?: boolean }) => {

    if (updates.name) {
        // Prevent renaming if it's a core system folder!
        const existingFolder = await Folder.findOne({ _id: folderId, userId });
        if (!existingFolder) {
            throw new AppError("Folder not found", 404);
        }
        if (existingFolder.isSystemFolder) {
            throw new AppError("System folders cannot be renamed", 403);
        }
    }

    const folder = await Folder.findOneAndUpdate(
        { _id: folderId, userId },
        { $set: updates },
        { new: true }
    );

    if (!folder) {
        throw new AppError("Folder not found", 404);
    }

    return folder;
}

export const deleteFolderService = async(folderId: string, userId: string) => {

    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
        throw new AppError("Folder not found", 404);
    }

    if (folder.isSystemFolder) {
        throw new AppError("System folders are restricted and cannot be deleted", 403);
    }

 
    const idsToDelete= [folderId];

    const childIdToDelete=async(parentId:string)=>{
        const children=await Folder.find({parentId});
        for(const child of children){
            idsToDelete.push(child._id.toString());
            childIdToDelete(child._id.toString())
        }
    }
    
    childIdToDelete(folderId)

  
    await Chat.deleteMany({ folderId: { $in: idsToDelete }, userId });
    await Folder.deleteMany({ _id: { $in: idsToDelete }, userId });

    return { deletedCount: idsToDelete.length };
}