import { IFolderRepository } from '../../../domain/folder/repositories/IFolderRepository';
import { IFolder } from '../../../domain/folder/entities/Folder';
import { Folder } from '../models/MongoFolderModel';
import { MongooseBaseRepository } from '../../shared/BaseRepository';
import { injectable } from 'tsyringe';
import mongoose from 'mongoose';

@injectable()
export class MongoFolderRepository
  extends MongooseBaseRepository<IFolder>
  implements IFolderRepository
{
  constructor() {
    super(Folder);
  }

  protected override mapToDomain(doc: Record<string, unknown>): IFolder {
    return {
      ...doc,
      _id: (doc._id as { toString(): string }).toString(),
      userId: (doc.userId as { toString(): string }).toString(),
      parentId: doc.parentId ? (doc.parentId as { toString(): string }).toString() : null,
    } as IFolder;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<IFolder | null> {
    const doc = await this.model.findOne({ _id: id, userId }).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByUserIdAndNameAndParent(userId: string, name: string, parentId: string | null): Promise<IFolder | null> {
    const doc = await this.model.findOne({ userId, name, parentId }).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAllByUserId(userId: string): Promise<IFolder[]> {
    const docs = await this.model.find({ userId }).session(this.getSession()).sort({ createdAt: 1, _id: 1 }).lean();
    return docs.map(doc => this.mapToDomain(doc));
  }

  async findFolderSubtree(folderId: string) {
  const result = await this.model.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(folderId),
      },
    },
    {
      $graphLookup: {
        from: "folders",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parentId",
        as: "descendants",
      },
    },
  ]);

  return result[0] || null;
}

  async findChildren(parentId: string): Promise<{ _id: string }[]> {
    const docs = await this.model.find({ parentId }).session(this.getSession()).select("_id").lean();
    return docs.map(doc => ({ _id: doc._id.toString() }));
  }

  async update(id: string, userId: string, updates: Partial<IFolder>): Promise<IFolder | null> {
    const doc = await this.model.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, session: this.getSession() }
    );
    return doc ? this.mapToDomain(doc.toObject ? doc.toObject() : doc) : null;
  }

  async insertMany(foldersData: Partial<IFolder>[]): Promise<IFolder[]> {
    const docs = await this.model.insertMany(foldersData, { session: this.getSession() || undefined });
    return docs.map(doc => this.mapToDomain(doc.toObject ? doc.toObject() : doc));
  }

  async deleteMany(ids: string[], userId: string): Promise<void> {
    await this.model.deleteMany({ _id: { $in: ids }, userId }, { session: this.getSession() || undefined });
  }

  async findByParentId(parentId: string): Promise<IFolder[]> {
    const docs = await this.model.find({ parentId }).session(this.getSession()).lean();
    return docs.map(doc => this.mapToDomain(doc));
  }

  async findByPrefix(userId: string, parentId: string | null, prefix: string): Promise<IFolder[]> {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = `^${escapedPrefix}( \\d+)?$`;
    const docs = await this.model.find({
      userId,
      parentId,
      name: { $regex: regexPattern }
    }).session(this.getSession()).lean();
    return docs.map(doc => this.mapToDomain(doc));
  }
}
