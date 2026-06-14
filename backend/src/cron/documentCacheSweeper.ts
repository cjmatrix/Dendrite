import { container } from "tsyringe";
import cron from "node-cron";
import { IContentHashRepository } from "../domain/chat/repositories/IContentHashRepository";
import { IVectorRepository } from "../domain/vector/repositories/IVectorRepository";
import { ILogger } from "../application/common/ports/ILogger";


cron.schedule("0 2 * * *", async () => {
  const logger = container.resolve<ILogger>("ILogger");
  logger.info("[Sweeper] Starting expired document cache sweeper...");

  try {
    const contentHashRepo = container.resolve<IContentHashRepository>("IContentHashRepository");
    const vectorRepo = container.resolve<IVectorRepository>("IVectorRepository");

    const expiredHashes = await contentHashRepo.findExpired(new Date());
    if (expiredHashes.length === 0) {
      logger.info("[Sweeper] No expired document vector cache records to sweep.");
      return;
    }

    logger.info(`[Sweeper] Found ${expiredHashes.length} expired document vector cache records.`);

    for (const record of expiredHashes) {
      try {
        await vectorRepo.deleteDocumentVectorsByContentHash(record.contentHash);

      
        await contentHashRepo.deleteByHash(record.contentHash);

        logger.info(`[Sweeper] Successfully swept expired cache for hash: ${record.contentHash}`);
      } catch (err) {
        logger.error(`[Sweeper] Failed to sweep expired cache for hash: ${record.contentHash}`, err);
      }
    }
  } catch (err) {
    logger.error("[Sweeper] Failed to run document cache sweeper:", err);
  }
});
