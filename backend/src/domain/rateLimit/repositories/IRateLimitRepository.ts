import { IRateLimit } from "../entities/RateLimit";

export interface IRateLimitRepository {
  findByKey(key: string): Promise<IRateLimit | null>;
  upsert(key: string, value: string | number | boolean | Record<string, unknown>): Promise<IRateLimit>;
}
