
import { Folder } from "../models/Folders"
import { Chat } from "../models/Chat"
import { AppError } from "../utils/AppError"
import { COLLECTION_NAME, qdrantClient, SUMMARY_COLLECTION_NAME } from "../config/qdrant";
export const createFolderService = async(userId: string, name: string,parentId:string|null) => {

    const folder= await Folder.findOne({userId:userId,name:name,parentId:parentId});
    if(folder){
        throw new AppError("Folder Already Exist",400);
    }

    const newFolder= await Folder.create({userId,name,parentId});
    return newFolder

}

export const getFoldersService = async(userId: string) => {

    const folders = await Folder.find({ userId }).sort({ createdAt: 1, _id: 1 }).lean();


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

export const deleteFolderService = async (folderId: string, userId: string) => {
  const folder = await Folder.findOne({ _id: folderId, userId });
  if (!folder) {
    throw new AppError("Folder not found", 404);
  }
  if (folder.isSystemFolder) {
    throw new AppError("System folders are restricted and cannot be deleted", 403);
  }


  const idsToDelete: string[] = [folderId];
  const queue: string[] = [folderId];
  const seen = new Set<string>([folderId]);
  let head = 0;
  while (head < queue.length) {
    const parent = queue[head++];
    const children = await Folder.find({ parentId: parent }).select("_id").lean();
    for (const c of children) {
      const id = c._id.toString();
      if (!seen.has(id)) {
        seen.add(id);
        idsToDelete.push(id);
        queue.push(id);
      }
    }
  }

  const chats = await Chat.find({ folderId: { $in: idsToDelete }, userId }).select("_id").lean();
  const chatIds = chats.map((c) => c._id.toString());

  
  if (chatIds.length > 0) {
    const filter = {
      must: [
        { key: "userId", match: { value: String(userId) } },
        { key: "chatId", match: { any: chatIds } }, 
      ],
    };

    try {
      await qdrantClient.delete(COLLECTION_NAME, { filter });
      await qdrantClient.delete(SUMMARY_COLLECTION_NAME, { filter });
      console.log(`✅ Deleted Qdrant vectors for ${chatIds.length} chats in folders: ${idsToDelete.length} folders`);
    } catch (err: any) {
      console.error("❌ Qdrant delete failed:", err?.message ?? err);
      throw err
    }
  } else {
    console.log("No chats found for those folders — skipping Qdrant delete.");
  }

  await Chat.deleteMany({ folderId: { $in: idsToDelete }, userId });
  await Folder.deleteMany({ _id: { $in: idsToDelete }, userId });

  return { deletedFolderCount: idsToDelete.length, deletedChatCount: chatIds.length };
};