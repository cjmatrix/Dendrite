import { IActiveUserTracker } from "../../application/common/ports/IActiveUserTracker";
import { ICacheService } from "../../application/common/ports/ICacheService";
import { injectable, inject } from "tsyringe";

@injectable()
export class RedisActiveUserTracker implements IActiveUserTracker {
  private prefix = "active_user:";

  constructor(@inject("ICacheService") private cacheService: ICacheService) {}

  async trackActive(identifier: string): Promise<void> {
    const key = `${this.prefix}${identifier}`;
    await this.cacheService.set(key, "1", { EX: 300 });
  }

  async getActiveCount(): Promise<number> {
    try {
      const keys = await this.cacheService.scanKeys(`${this.prefix}*`);
      return keys.length;
    } catch (err) {
      console.error("[RedisActiveUserTracker] Failed to scan active keys:", err);
      return 0;
    }
  }
}
