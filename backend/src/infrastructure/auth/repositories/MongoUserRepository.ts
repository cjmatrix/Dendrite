import { User, IMongoUserDocument } from "../models/MongoUserModel";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IUser } from "../../../domain/auth/entities/User";
import { injectable } from "tsyringe";
import { transactionStorage } from "../../shared/MongooseUnitOfWork";

@injectable()
export class MongoUserRepository implements IUserRepository {
  private getSession(): any {
    return transactionStorage.getStore() || undefined;
  }

  private mapToDomain(doc: any): IUser {
    return {
      ...doc,
      _id: doc._id.toString(),
    };
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const doc = await User.findOne({ email }).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findById(id: string): Promise<IUser | null> {
    const doc = await User.findById(id).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByIdSafe(id: string): Promise<IUser | null> {
    const doc = await User.findById(id).session(this.getSession()).select("-password -refreshTokens").lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async create(userData: any): Promise<IUser> {
    const doc = new User(userData);
    return this.mapToDomain(doc.toObject());
  }

  async save(user: IUser, session?: any): Promise<IUser> {
    const activeSession = session || this.getSession();
    if (user && typeof (user as any).save === "function") {
      const doc = await (user as any).save({ session: activeSession });
      return this.mapToDomain(doc);
    }

    let query = User.findById(user._id);
    if (activeSession) {
      query = query.session(activeSession);
    }
    let doc = await query;

    if (!doc) {
      doc = new User(user);
    } else {
      doc.set(user);
    }
    const savedDoc = await doc.save({ session: activeSession });
    return this.mapToDomain(savedDoc);
  }

  async updateRefreshTokens(userId: string, tokens: string[]): Promise<void> {
    await User.findByIdAndUpdate(
      userId,
      { $set: { refreshTokens: tokens } },
      { session: this.getSession() }
    );
  }

  async addRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(
      userId,
      { $push: { refreshTokens: token } },
      { session: this.getSession() }
    );
  }

  async replaceRefreshToken(
    userId: string,
    oldToken: string,
    newToken: string,
  ): Promise<void> {
    await User.updateOne(
      { _id: userId, refreshTokens: oldToken },
      { $set: { "refreshTokens.$": newToken } },
      { session: this.getSession() }
    );
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(
      userId,
      { $pull: { refreshTokens: token } },
      { session: this.getSession() }
    );
  }

  async clearRefreshTokens(userId: string): Promise<void> {
    await User.findByIdAndUpdate(
      userId,
      { $set: { refreshTokens: [] } },
      { session: this.getSession() }
    );
  }
}
