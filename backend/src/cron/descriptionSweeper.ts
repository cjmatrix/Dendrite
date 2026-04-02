import cron from "node-cron";
import { CodeBlock } from "../models/CodeBlock";
import addDescriptionQueue from "../queue/descriptionQueue";


cron.schedule("*/10 * * * *", async () => {
  try {

    const TEN_MIN_AGO = new Date(Date.now() - 10 * 60 * 1000);

    const strandedBlocks = await CodeBlock.find({
      description: "",
      createdAt: { $lt: TEN_MIN_AGO },
    }).limit(50); 

    if (strandedBlocks.length === 0) {
     
      return;
    }

    console.log(
      `[Description Sweeper] Found ${strandedBlocks.length} stranded code blocks without descriptions.`,
    );


    const queuePayload = strandedBlocks.map((b) => ({
      _id: b._id.toString(),
      userId: b.userId.toString(),
      chatId: b.chatId.toString(),
      code: b.code,
      language: b.language,
      hash: b.hash,
    }));


    await addDescriptionQueue(queuePayload);
    console.log(
      `[Description Sweeper] Re-queued ${queuePayload.length} stranded blocks successfully!`,
    );
  } catch (err) {
    console.error(`[Description Sweeper] failed:`, err);
  }
});
