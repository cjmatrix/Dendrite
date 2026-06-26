import { User } from "../models/MongoUserModel";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IUser } from "../../../domain/auth/entities/User";
import { injectable } from "tsyringe";
import { MongooseBaseRepository } from "../../shared/BaseRepository";

@injectable()
export class MongoUserRepository
  extends MongooseBaseRepository<IUser>
  implements IUserRepository
{
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const doc = await this.model
      .findOne({ email })
      .session(this.getSession() ?? null)
      .lean();
    return doc ? this.mapToDomain(doc as Record<string, unknown>) : null;
  }

  async findByIdSafe(id: string): Promise<IUser | null> {
    const doc = await this.model
      .findById(id)
      .session(this.getSession() ?? null)
      .select("-password")
      .lean();
    return doc ? this.mapToDomain(doc as Record<string, unknown>) : null;
  }

  async findAll(
    filter: Record<string, unknown> = {},
    options?: { limit?: number; skip?: number; sort?: Record<string, unknown> },
  ): Promise<IUser[]> {
    const activeSession = this.getSession();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = this.model.find(filter).session(activeSession as any);

    if (options?.sort) {
      query = query.sort(options.sort as Parameters<typeof query.sort>[0]);
    }

    if (options?.skip !== undefined) {
      query = query.skip(options.skip);
    }
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    const docs = await query.lean();

    return docs.map((doc) => this.mapToDomain(doc as Record<string, unknown>));
  }

  async aggregate(pipeline: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await this.model.aggregate(pipeline as any[]).session(this.getSession() as any);
  }

  async findByBillingCustomerId(customerId: string): Promise<IUser | null> {
    const doc = await this.model
      .findOne({ billingCustomerId: customerId })
      .session(this.getSession() ?? null)
      .lean();
    return doc ? this.mapToDomain(doc as Record<string, unknown>) : null;
  }

  async updateByBillingCustomerId(customerId: string, update: Record<string, unknown>): Promise<IUser | null> {
    const doc = await this.model
      .findOneAndUpdate({ billingCustomerId: customerId }, update, { new: true })
      .session(this.getSession() ?? null)
      .lean();
    return doc ? this.mapToDomain(doc as Record<string, unknown>) : null;
  }
}
