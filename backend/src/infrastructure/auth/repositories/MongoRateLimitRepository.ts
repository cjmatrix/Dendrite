import { injectable } from "tsyringe";
import { IRateLimitRepository } from "../../../domain/rateLimit/repositories/IRateLimitRepository";
import { IRateLimit } from "../../../domain/rateLimit/entities/RateLimit";
import { MongoRateLimit } from "../models/MongoRateLimitModel";

@injectable()
export class MongoRateLimitRepository implements IRateLimitRepository {
  async findByKey(key: string): Promise<IRateLimit | null> {
    const doc = await MongoRateLimit.findOne({ key }).lean();
    if (!doc) return null;
    return {
      key: doc.key,
      value: doc.value,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async upsert(key: string, value: string | number | boolean | Record<string, unknown>): Promise<IRateLimit> {
    const doc = await MongoRateLimit.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    ).lean();
    return {
      key: doc.key,
      value: doc.value,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
