import { IFolderRepository } from '../../../domain/folder/repositories/IFolderRepository';
import { Folder } from '../../../models/Folders';

export class MongoFolderRepository implements IFolderRepository {
  async findByIdAndUserId(id: string, userId: string): Promise<any | null> {
    return Folder.findOne({ _id: id, userId });
  }

  async findByUserIdAndNameAndParent(userId: string, name: string, parentId: string | null): Promise<any | null> {
    return Folder.findOne({ userId, name, parentId });
  }

  async findAllByUserId(userId: string): Promise<any[]> {
    return Folder.find({ userId }).sort({ createdAt: 1, _id: 1 }).lean();
  }

  async findChildren(parentId: string): Promise<any[]> {
    return Folder.find({ parentId }).select("_id").lean();
  }

  async create(folderData: any): Promise<any> {
    return Folder.create(folderData);
  }

  async update(id: string, userId: string, updates: any): Promise<any | null> {
    return Folder.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true }
    );
  }

  async deleteMany(ids: string[], userId: string): Promise<void> {
    await Folder.deleteMany({ _id: { $in: ids }, userId });
  }
}
