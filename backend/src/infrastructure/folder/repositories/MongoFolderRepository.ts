import { IFolderRepository } from '../../../domain/folder/repositories/IFolderRepository';
import { IFolder } from '../../../domain/folder/entities/Folder';
import { transactionStorage } from '../../shared/MongooseUnitOfWork';
import { Folder } from '../models/MongoFolderModel';
import { injectable } from 'tsyringe';

@injectable()
export class MongoFolderRepository implements IFolderRepository {
  private getSession(): any {
    return transactionStorage.getStore() || undefined;
  }

  private mapToDomain(doc: any): IFolder {
    return {
      ...doc,
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      parentId: doc.parentId ? doc.parentId.toString() : null,
    };
  }

  async findByIdAndUserId(id: string, userId: string): Promise<IFolder | null> {
    const doc = await Folder.findOne({ _id: id, userId }).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByUserIdAndNameAndParent(userId: string, name: string, parentId: string | null): Promise<IFolder | null> {
    const doc = await Folder.findOne({ userId, name, parentId }).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAllByUserId(userId: string): Promise<IFolder[]> {
    const docs = await Folder.find({ userId }).session(this.getSession()).sort({ createdAt: 1, _id: 1 }).lean();
    return docs.map(doc => this.mapToDomain(doc));
  }

  async findChildren(parentId: string): Promise<{ _id: string }[]> {
    const docs = await Folder.find({ parentId }).session(this.getSession()).select("_id").lean();
    return docs.map(doc => ({ _id: doc._id.toString() }));
  }

  async create(folderData: Partial<IFolder>): Promise<IFolder> {
    const [doc] = await Folder.create([folderData], { session: this.getSession() });
    return this.mapToDomain(doc.toObject());
  }

  async update(id: string, userId: string, updates: Partial<IFolder>): Promise<IFolder | null> {
    const doc = await Folder.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, session: this.getSession() }
    );
    return doc ? this.mapToDomain(doc.toObject ? doc.toObject() : doc) : null;
  }

  async insertMany(foldersData: Partial<IFolder>[]): Promise<IFolder[]> {
    const docs = await Folder.insertMany(foldersData, { session: this.getSession() });
    return docs.map(doc => this.mapToDomain(doc.toObject ? doc.toObject() : doc));
  }

  async deleteMany(ids: string[], userId: string): Promise<void> {
    await Folder.deleteMany({ _id: { $in: ids }, userId }, { session: this.getSession() });
  }
}
