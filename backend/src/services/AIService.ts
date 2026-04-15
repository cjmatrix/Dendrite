import { redisConnection } from '../config/redis';
import { getTavilySearchContext } from './searchCacheService';
import { getRotatedAI, rotateAIKey, aiInstances } from '../config/AIConfig';
import CONTEXT_WINDOW from '../constants/contextWindow';

/**
 * AIService - handles AI-related operations
 * Separates AI logic from the presentation layer
 * Manages routing, streaming, and context management
 */
export class AIService {
  /**
   * Determine if internet search is needed for a query
   */
  static async shouldUseInternetSearch(queryText: string): Promise<boolean> {
    const routingPrompt = `Determine if the following user query requires an internet search to be answered accurately. 
Respond ONLY with "YES" if it requires knowledge of recent events, real-time facts, current weather, news, specific web sources, or things outside typical LLM pre-training data.
Respond ONLY with "NO" if it is a general reasoning, coding, writing, or conceptual question that can be answered without internet access.
User query: "${queryText}"`;

    let routerAttempts = 0;
    while (routerAttempts < aiInstances.length) {
      try {
        const activeAi = getRotatedAI();
        const routerResponse = await activeAi.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: [{ role: 'user', parts: [{ text: routingPrompt }] }],
        });
        return routerResponse?.text?.trim().toUpperCase() === 'YES';
      } catch (error: any) {
        if (
          error.status === 429 ||
          error.message?.includes('quota') ||
          error.message?.includes('RESOURCE_EXHAUSTED')
        ) {
          rotateAIKey();
          routerAttempts++;
          continue;
        }
        throw error;
      }
    }
    return false;
  }

  /**
   * Get internet context for a query using search
   */
  static async getInternetContext(
    queryText: string,
    descQueryVector: any,
  ): Promise<string> {
    try {
      const shouldSearch = await this.shouldUseInternetSearch(queryText);

      if (shouldSearch) {
        console.log(`[Router] internet search needed for query: "${queryText}"`);
        const context = await getTavilySearchContext(queryText, descQueryVector);
        return context || '';
      }

      console.log(`[Router] no internet search needed for query: "${queryText}"`);
      return '';
    } catch (error) {
      console.error('Routing/Search error:', error);
      return '';
    }
  }

  /**
   * Stream AI content with automatic fallback and quota handling
   */
  static async streamAIContent(
    contents: any[],
    model: string = 'gemini-3-flash-preview',
  ) {
    let stream;
    let attempts = 0;

    while (attempts < aiInstances.length) {
      try {
        const activeAi = getRotatedAI();
        stream = await activeAi.models.generateContentStream({
          model,
          contents,
        });
        return stream;
      } catch (error: any) {
        if (
          error.status === 429 ||
          error.message?.includes('quota') ||
          error.message?.includes('RESOURCE_EXHAUSTED')
        ) {
          rotateAIKey();
          attempts++;
          continue;
        }
        throw error;
      }
    }

    throw new Error('All AI instances exhausted quota');
  }

  /**
   * Get cached anchor context or fetch it
   */
  static async getAnchorContext(
    chatId: string,
    anchorMessageId: string,
    messageRepo: any,
  ): Promise<any[]> {
    const cacheKey = `anchor_ctx:${anchorMessageId}`;

    try {
      const cachedData = await redisConnection.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const anchorMsg = await messageRepo.findById(anchorMessageId);
      if (!anchorMsg) return [];

      const contextMessages = await messageRepo.findAnchorContext(
        chatId,
        anchorMsg.createdAt,
        4,
      );

      const result = contextMessages.reverse();

      await redisConnection.setex(cacheKey, 7200, JSON.stringify(result));

      return result;
    } catch (err) {
      console.error('getAnchorContext error:', err);
      return [];
    }
  }

  /**
   * Build system prompt for quick chat
   */
  static buildQuickChatSystemPrompt(
    historicalContext: string,
    highlightedText: string,
  ): string {
    return `You are a surgical AI Assistant specialized in analyzing highlights within a side-modal.
---
HISTORICAL CONTEXT (for background only):
${historicalContext}

USER'S HIGHLIGHT (your primary focus):
"${highlightedText}"
---
RESPONSE GUIDELINES:
- DEFAULT: Be brief. Use crisp bullet points and short, punchy sentences in default but you can identify user need and have the flexibility to generate response.
- ONLY provide an expansive/detailed explanation if the user specifically asks to explanation in detailed manner or any other specific style according to user query".
.`;
  }

  /**
   * Convert image URL to base64
   */
  static async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    } catch (error) {
      console.error('Error converting image URL to base64:', error);
      return '';
    }
  }
}
