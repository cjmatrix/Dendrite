import cron from "node-cron";
import { QdrantVectorRepository } from '../infrastructure/vector/repositories/QdrantVectorRepository';

cron.schedule("0 * * * *", async () => {
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);

    try {
        const vectorRepo = new QdrantVectorRepository();
        await vectorRepo.deleteOldSearchCache(twelveHoursAgo);
        console.log("🧹 Qdrant search cache swept explicitly (outdated points cleared).");
    } catch (err) {
        console.error("❌ Failed to sweep Qdrant search cache:", err);
    }
});
