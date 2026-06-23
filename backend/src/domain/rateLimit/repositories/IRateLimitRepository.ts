import { IRateLimit } from "../entities/RateLimit";

export interface IRateLimitRepository {
  findByKey(key: string): Promise<IRateLimit | null>;
  upsert(key: string, value: any): Promise<IRateLimit>;
}
