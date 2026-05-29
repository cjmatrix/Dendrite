import { Model } from "mongoose";
import { IBaseRepository } from "../../application/common/ports/IBaseRepository"
import { transactionStorage } from "../shared/MongooseUnitOfWork";


export class MongooseBaseRepository<T extends { _id: string }> implements IBaseRepository<T> {
  
  constructor(protected model: Model<any>) {}


  protected getSession(): any {
    return transactionStorage.getStore() || undefined;
  }

  protected mapToDomain(doc: any): T {
    return {
      ...doc,
      _id: doc._id.toString(),
    } as T;
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.model.findById(id).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async create(data: any): Promise<T> {
    const doc = new this.model(data);
    return this.mapToDomain(doc.toObject());
  }

  async save(entity: T): Promise<T> {
    const activeSession = this.getSession();

    let query = this.model.findById(entity._id);
    if (activeSession) {
      query = query.session(activeSession);
    }
    let doc = await query;

    if (!doc) {
      doc = new this.model(entity);
    } else {
      doc.set(entity);
    }

    const savedDoc = await doc.save({ session: activeSession });
    return this.mapToDomain(savedDoc.toObject());
  }

  async count(filter: any = {}): Promise<number> {
    const activeSession = this.getSession();
    return await this.model.countDocuments(filter).session(activeSession);
  }

  async findByIdAndUpdate(id: string, update: any): Promise<T | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, update, { new: true })
      .session(this.getSession())
      .lean();
    return doc ? this.mapToDomain(doc) : null;
  }
}
