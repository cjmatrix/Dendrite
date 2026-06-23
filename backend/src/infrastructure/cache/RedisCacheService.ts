import { ICacheService, CacheSetOptions, ICachePipeline } from "../../application/common/ports/ICacheService";
import { injectable, inject } from "tsyringe";
import { Redis, ChainableCommander } from "ioredis";

class RedisCachePipeline implements ICachePipeline {
  private pipelineInstance: ChainableCommander;

  constructor(redis: Redis) {
    this.pipelineInstance = redis.pipeline();
  }

  get(key: string): ICachePipeline {
    this.pipelineInstance.get(key);
    return this;
  }

  set(key: string, value: string, options?: CacheSetOptions): ICachePipeline {
    if (options) {
      if (options.EX) {
        this.pipelineInstance.set(key, value, "EX", options.EX);
      } else if (options.PX) {
        this.pipelineInstance.set(key, value, "PX", options.PX);
      } else {
        this.pipelineInstance.set(key, value);
      }
    } else {
      this.pipelineInstance.set(key, value);
    }
    return this;
  }

  del(key: string): ICachePipeline {
    this.pipelineInstance.del(key);
    return this;
  }

  async exec(): Promise<unknown[]> {
    const results = await this.pipelineInstance.exec();
    if (!results) return [];
    return results.map(([err, val]: [Error | null, unknown]) => {
      if (err) throw err;
      return val;
    });
  }
}

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

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.redis.ping();
      return res === "PONG";
    } catch {
      return false;
    }
  }

  pipeline(): ICachePipeline {
    return new RedisCachePipeline(this.redis);
  }
}
