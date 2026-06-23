import { User } from "../models/MongoUserModel";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IUser } from "../../../domain/auth/entities/User";
import { injectable } from "tsyringe";
import { transactionStorage } from "../../shared/MongooseUnitOfWork";
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
      .session(this.getSession())
      .lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByIdSafe(id: string): Promise<IUser | null> {
    const doc = await this.model
      .findById(id)
      .session(this.getSession())
      .select("-password")
      .lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAll(
    filter: any = {},
    options?: { limit?: number; skip?: number; sort?: any },
  ): Promise<IUser[]> {
    const activeSession = this.getSession();

    let query = this.model.find(filter).session(activeSession);

    if (options?.sort) {
      query = query.sort(options.sort);
    }

    if (options?.skip !== undefined) {
      query = query.skip(options.skip);
    }
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    const docs = await query.lean();

    return docs.map((doc) => this.mapToDomain(doc));
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return await this.model.aggregate(pipeline).session(this.getSession());
  }

  async findByBillingCustomerId(customerId: string): Promise<IUser | null> {
    const doc = await this.model
      .findOne({ billingCustomerId: customerId })
      .session(this.getSession())
      .lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async updateByBillingCustomerId(customerId: string, update: any): Promise<IUser | null> {
  const doc = await this.model
    .findOneAndUpdate({ billingCustomerId: customerId }, update, { new: true })
    .session(this.getSession())
    .lean();
  return doc ? this.mapToDomain(doc) : null;  
  } 
}
