import { ICodeBlockRepository } from "../../../domain/chat/repositories/ICodeBlockRepository";
import { CodeBlock } from "../models/MongoCodeBlockModel";
import { MongooseBaseRepository } from "../../shared/BaseRepository";
import { ICodeBlock } from "../../../domain/chat/entities/CodeBlock";

export class MongoCodeBlockRepository
  extends MongooseBaseRepository<ICodeBlock>
  implements ICodeBlockRepository
{
  constructor() {
    super(CodeBlock);
  }

  async findStrandedBlocks(
    limit: number,
    beforeDate: Date,
  ): Promise<ICodeBlock[]> {
    const docs = await this.model
      .find({
        description: "",
        needsDescription: true,
        createdAt: { $lt: beforeDate },
      })
      .limit(limit)
      .lean();
    return docs.map((doc) => this.mapToDomain(doc as Record<string, unknown>));
  }

  async findUndescribedByChatId(chatId: string): Promise<ICodeBlock[]> {
    const docs = await this.model.find({ chatId, description: "" }).lean();
    return docs.map((doc) => this.mapToDomain(doc as Record<string, unknown>));
  }

  async markUndescribedAsNeedingDescription(
    chatId: string,
    session?: unknown,
  ): Promise<void> {
    const activeSession = session || this.getSession();
    const query = this.model.updateMany(
      { chatId, description: "" },
      { $set: { needsDescription: true } },
    );
    if (activeSession) {
      query.session(activeSession as import("mongoose").ClientSession);
    }
    await query;
  }

  async bulkUpdateDescriptions(updates: Record<string, unknown>[], session?: unknown): Promise<unknown> {
    const activeSession = session || this.getSession();
    if (activeSession) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.model.bulkWrite(updates as any[], { session: activeSession as any });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.model.bulkWrite(updates as any[]);
  }

  async findByHash(hash: string): Promise<ICodeBlock | null> {
    const doc = await this.model.findOne({ hash }).lean();
    return doc ? this.mapToDomain(doc as Record<string, unknown>) : null;
  }

  async insertMany(blocks: Partial<ICodeBlock>[], session?: unknown): Promise<ICodeBlock[]> {
    let docs;
    const activeSession = session || this.getSession();
    if (activeSession) {
      docs = await this.model.insertMany(blocks, { session: activeSession as import("mongoose").ClientSession });
    } else {
      docs = await this.model.insertMany(blocks);
    }
    const docsTyped = docs as unknown as { toObject?: () => Record<string, unknown> }[];
    return docsTyped.map((doc) =>
      this.mapToDomain((doc.toObject ? doc.toObject() : doc) as Record<string, unknown>),
    );
  }

  async deleteByChatId(chatId: string, userId: string): Promise<void> {
    await this.model.deleteMany({ chatId, userId }).session(this.getSession());
  }
}
