import { ICacheService, CacheSetOptions } from "../../application/common/ports/ICacheService";
import { injectable, inject } from "tsyringe";
import { Redis } from "ioredis";

@injectable()
export class RedisCacheService implements ICacheService {
  constructor(@inject("RedisClient") private redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, options?: CacheSetOptions): Promise<void> {
    if (options) {
      if (options.EX) {
        await this.redis.set(key, value, "EX", options.EX);
      } else if (options.PX) {
        await this.redis.set(key, value, "PX", options.PX);
      } else {
        await this.redis.set(key, value);
      }
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.redis.exists(key);
    return count > 0;
  }

  async scanKeys(pattern: string): Promise<string[]> {
    let cursor = "0";
    const allKeys: string[] = [];
    do {
      const result = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = result[0];
      const keys = result[1];
      allKeys.push(...keys);
    } while (cursor !== "0");
    return allKeys;
  }
}
