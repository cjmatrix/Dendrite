import { IContentHashRepository } from "../../../domain/chat/repositories/IContentHashRepository";
import { ContentHash } from "../models/MongoContentHashModel";
import { MongooseBaseRepository } from "../../shared/BaseRepository";
import { IContentHash } from "../../../domain/chat/entities/ContentHash";

export class MongoContentHashRepository
  extends MongooseBaseRepository<IContentHash>
  implements IContentHashRepository
{
  constructor() {
    super(ContentHash);
  }

  async findByHash(contentHash: string): Promise<IContentHash | null> {
    const doc = await this.model.findOne({ contentHash }).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findExpired(now: Date): Promise<IContentHash[]> {
    const docs = await this.model
      .find({ status: "expired", expireAt: { $lte: now } })
      .session(this.getSession())
      .lean();
    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async deleteByHash(contentHash: string): Promise<boolean> {
    const result = await this.model.findOneAndDelete({ contentHash }).session(this.getSession());
    return result !== null;
  }
}
