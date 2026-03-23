import cron from "node-cron";
import { qdrantClient, SEARCH_CACHE_COLLECTION } from "../config/qdrant";


cron.schedule("0 * * * *", async () => {
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);

    try {
        await qdrantClient.delete(SEARCH_CACHE_COLLECTION, {
            filter: {
                must: [
                    {
                        key: "createdAt",
                        range: { lt: twelveHoursAgo }
                    }
                ]
            }
        });
        console.log("🧹 Qdrant search cache swept explicitly (outdated points cleared).");
    } catch (err) {
        console.error("❌ Failed to sweep Qdrant search cache:", err);
    }
});
