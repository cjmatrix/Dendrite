import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { generateRecursiveSummary } from '../../../utils/AISummary';

export class ProcessStateJob {
  constructor(
    private outboxRepository: IOutboxEventRepository,
    private chatRepository: IChatRepository,
    private redisConnection: any
  ) {}

  async execute(stateOutboxEventId: string, messageToCompress: any[], previousSummary?: string | null) {
    try {
      const outboxEvent = await this.outboxRepository.findById(stateOutboxEventId);
      if (!outboxEvent) {
        throw new Error(`Outbox event not found: ${stateOutboxEventId}`);
      }

      const cacheKey = `llm_summary:${stateOutboxEventId}`;
      let updatedSummary = await this.redisConnection.get(cacheKey);

      if (!updatedSummary) {
        console.log(`🧠 Calling LLM for new state summary (${stateOutboxEventId})`);
        
        updatedSummary = await generateRecursiveSummary(
          previousSummary || null,
          messageToCompress,
        );

        await this.redisConnection.setex(cacheKey, 24 * 60 * 60, updatedSummary);
      } else {
        console.log(`♻️ Found existing LLM summary in Redis for ${stateOutboxEventId}, skipping Gemini API call.`);
      }

      await this.chatRepository.update(
        outboxEvent.payload.sourceId.toString(),
        outboxEvent.payload.userId.toString(),
        { summary: updatedSummary }
      );

      console.log(`✅ Updated Recursive Summary for chat ${outboxEvent.payload.sourceId}`);

      await this.outboxRepository.updateStatus(stateOutboxEventId, "processed");
    } catch (error: any) {
      await this.outboxRepository.updateStatus(stateOutboxEventId, "failed", { error: error.message, incrementRetry: true });
      console.log(error.message);
      throw error;
    }
  }
}
