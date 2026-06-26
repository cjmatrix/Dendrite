import { Model, ClientSession } from "mongoose";
import { IBaseRepository } from "../../application/common/ports/IBaseRepository";
import { transactionStorage } from "./MongooseUnitOfWork";

export class MongooseBaseRepository<
  T extends { _id: string },
> implements IBaseRepository<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(protected model: Model<any>) {}

  protected getSession(): ClientSession | null {
    return (transactionStorage.getStore() as ClientSession) || null;
  }

  protected mapToDomain(doc: Record<string, unknown>): T {
    return {
      ...doc,
      _id: (doc._id as { toString(): string }).toString(),
    } as T;
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.model.findById(id).session(this.getSession() ?? null).lean();
    return doc ? this.mapToDomain(doc as Record<string, unknown>) : null;
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = await this.model.create(data);
    return this.mapToDomain((doc.toObject ? doc.toObject() : doc) as Record<string, unknown>);
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
    return this.mapToDomain(savedDoc.toObject() as Record<string, unknown>);
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    const activeSession = this.getSession();
    return await this.model.countDocuments(filter).session(activeSession ?? null);
  }

  async findByIdAndUpdate(id: string, update: Record<string, unknown>): Promise<T | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, update, { new: true })
      .session(this.getSession() ?? null)
      .lean();
    return doc ? this.mapToDomain(doc as Record<string, unknown>) : null;
  }
}
