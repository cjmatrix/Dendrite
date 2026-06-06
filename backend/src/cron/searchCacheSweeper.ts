import { container } from "tsyringe";
import cron from "node-cron";
import { IVectorRepository } from '../domain/vector/repositories/IVectorRepository';

cron.schedule("0 * * * *", async () => {
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);

    try {
        const vectorRepo = container.resolve<IVectorRepository>("IVectorRepository");
        await vectorRepo.deleteOldSearchCache(twelveHoursAgo);
        console.log(" Qdrant search cache swept explicitly (outdated points cleared).");
    } catch (err) {
        console.error(" Failed to sweep Qdrant search cache:", err);
    }
});
