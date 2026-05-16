import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { generateRecursiveSummary } from '../../../utils/AISummary';


const SUMMARY_MAX_TOKENS = 800;

function enforceSummaryBudget(summary: string, maxTokens: number = SUMMARY_MAX_TOKENS): string {
  const estimatedTokens = Math.ceil(summary.length / 4);

  if (estimatedTokens <= maxTokens) {
    return summary;
  }

  console.warn(
    `⚠️ Summary over budget — est. ${estimatedTokens} tokens, trimming to ${maxTokens}`
  );

  const lines = summary
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const dropOrder = ['[CONTEXT]', '[CONCEPT]', '[PROBLEM]', '[PROGRESS]'];
  let trimmed = [...lines];

  for (const tag of dropOrder) {
    const currentTokens = Math.ceil(trimmed.join('\n').length / 4);
    if (currentTokens <= maxTokens) break;

    for (let i = trimmed.length - 1; i >= 0; i--) {
      if (trimmed[i].startsWith(tag)) {
        trimmed.splice(i, 1);
        break;
      }
    }
  }

  const result = trimmed.join('\n');
  const finalTokens = Math.ceil(result.length / 4);

  if (finalTokens > maxTokens) {
    const charLimit = maxTokens * 4;
    const sliced = result.slice(0, charLimit);
    const lastNewline = sliced.lastIndexOf('\n');
    return lastNewline > 0 ? sliced.slice(0, lastNewline) : sliced;
  }

  return result;
}


interface MessageToCompress {
  role: 'user' | 'assistant' | 'system';
  content: string;
}


export class ProcessStateJob {
  constructor(
    private outboxRepository: IOutboxEventRepository,
    private chatRepository: IChatRepository,
    private redisConnection: any
  ) {}

  async execute(
    stateOutboxEventId: string,
    messageToCompress: MessageToCompress[],
    previousSummary?: string | null
  ) {
    try {
      const outboxEvent = await this.outboxRepository.findById(stateOutboxEventId);
      if (!outboxEvent) {
        throw new Error(`Outbox event not found: ${stateOutboxEventId}`);
      }

      const cacheKey = `llm_summary:${stateOutboxEventId}`;
      let updatedSummary = await this.redisConnection.get(cacheKey);

      if (!updatedSummary) {
        console.log(`🧠 Calling LLM for summary (${stateOutboxEventId})`);

        const rawSummary = await generateRecursiveSummary(
          previousSummary || null,
          messageToCompress,
        );

       
        updatedSummary = enforceSummaryBudget(rawSummary);

        await this.redisConnection.setex(
          cacheKey,
          24 * 60 * 60,
          updatedSummary  
        );

      } else {
        console.log(`♻️ Using cached summary for ${stateOutboxEventId}`);
      }

      await this.chatRepository.update(
        outboxEvent.payload.sourceId.toString(),
        outboxEvent.payload.userId.toString(),
        { summary: updatedSummary }
      );

      console.log(
        `✅ Summary updated for chat ${outboxEvent.payload.sourceId} ` +
        `(est. ${Math.ceil(updatedSummary.length / 4)} tokens)`
      );

      await this.outboxRepository.updateStatus(stateOutboxEventId, "processed");

    } catch (error: any) {
      await this.outboxRepository.updateStatus(
        stateOutboxEventId,
        "failed",
        { error: error.message, incrementRetry: true }
      );
      console.error(`❌ ProcessStateJob failed:`, error.message);
      throw error;
    }
  }
}