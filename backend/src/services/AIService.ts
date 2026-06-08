import { redisConnection } from "../config/redis";
import { GoogleGenAI } from "@google/genai";
import { getTavilySearchContext } from "./searchCacheService";
import { getRotatedAI, rotateAIKey, aiInstances, systemInstruction } from "../config/AIConfig";
import CONTEXT_WINDOW from "../constants/contextWindow";
import { estimateTokenCount } from "../utils/tokenCounter";
import { getCachedDecryptedKeys, getActiveBYOKKeyIndex, rotateBYOKKeyIndex } from "../utils/byokKeysHelper";

export class AIService {
 
  
   
  static async shouldUseInternetSearch(queryText: string, userId?: string): Promise<boolean> {
    const routingPrompt = `Determine if the following user query requires an internet search to be answered accurately. 
Respond ONLY with "YES" if it requires knowledge of recent events, real-time facts, current weather, news, specific web sources, or things outside typical LLM pre-training data.
Respond ONLY with "NO" if it is a general reasoning, coding, writing, or conceptual question that can be answered without internet access.
User query: "${queryText}"`;

    let routerAttempts = 0;
    let keys: string[] = [];
    let currentIdx = 0;
    if (userId) {
      keys = await getCachedDecryptedKeys(userId, "gemini");
    }

    const instances = keys.length > 0 ? keys.map((key) => new GoogleGenAI({ apiKey: key })) : [];
    if (instances.length > 0 && userId) {
      currentIdx = await getActiveBYOKKeyIndex(userId, "gemini");
      currentIdx = currentIdx % instances.length;
    }
    const totalInstances = instances.length > 0 ? instances.length : aiInstances.length;

    while (routerAttempts < totalInstances) {
      try {
        const activeAi = instances.length > 0 ? instances[currentIdx] : await getRotatedAI();
        const routerResponse = await activeAi.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: [{ role: "user", parts: [{ text: routingPrompt }] }],
        });
        return routerResponse?.text?.trim().toUpperCase() === "YES";
      } catch (error: any) {
        if (
          error.status === 429 ||
          error.message?.includes("quota") ||
          error.message?.includes("RESOURCE_EXHAUSTED")
        ) {
          if (instances.length > 0 && userId) {
            currentIdx = await rotateBYOKKeyIndex(userId, instances.length, "gemini");
          } else {
            await rotateAIKey();
          }
          routerAttempts++;
          continue;
        }
        throw error;
      }
    }
    return false;
  }

  
   
  static async getInternetContext(
    queryText: string,
    descQueryVector: any,
    userId?: string
  ): Promise<string> {
    try {
      const shouldSearch = await this.shouldUseInternetSearch(queryText, userId);

      if (shouldSearch) {
        console.log(
          `[Router] internet search needed for query: "${queryText}"`,
        );
        const context = await getTavilySearchContext(
          queryText,
          descQueryVector,
        );
        return context || "";
      }

      console.log(
        `[Router] no internet search needed for query: "${queryText}"`,
      );
      return "";
    } catch (error) {
      console.error("Routing/Search error:", error);
      return "";
    }
  }

  
   
  static async streamAIContent(
    contents: any[],
    model: string = "gemini-3-flash-preview",
    signal?:AbortSignal
  ) {
    let stream;
    let attempts = 0;

    while (attempts < aiInstances.length) {
      try {
        const activeAi = await getRotatedAI();
        stream = await activeAi.models.generateContentStream({
          model,
          contents,
        });
        return stream;
      } catch (error: any) {
        console.log(error.status,"hereeeeeeeeeeeeeeeeeeeeeee")
        if (
          error.status === 429 ||
          error.status===503||
          error.status===400||
          error.message?.includes("high demand")||
          error.message?.includes("quota") ||
          error.message?.includes("RESOURCE_EXHAUSTED")
        ) {
          await rotateAIKey();
          attempts++;
          continue;
        }
        throw error;
      }
    }

    throw new Error("All AI instances exhausted quota");
  }

  static async streamAIContentWithKeys(
    contents: any[],
    model: string,
    keys: string[],
    signal?: AbortSignal,
    userId?: string
  ) {
    let stream;
    let attempts = 0;
    
    const instances = keys.map((key) => new GoogleGenAI({ apiKey: key }));
    let currentIdx = 0;
    if (userId && instances.length > 0) {
      currentIdx = await getActiveBYOKKeyIndex(userId, "gemini");
      currentIdx = currentIdx % instances.length;
    }

    while (attempts < instances.length) {
      try {
        const activeAi = instances[currentIdx];
        stream = await activeAi.models.generateContentStream({
          model,
          contents,
        });
        return stream;
      } catch (error: any) {
        if (
          error.status === 429 ||
          error.status === 503 ||
          error.status === 400 ||
          error.message?.includes("high demand") ||
          error.message?.includes("quota") ||
          error.message?.includes("RESOURCE_EXHAUSTED")
        ) {
          if (userId) {
            currentIdx = await rotateBYOKKeyIndex(userId, instances.length, "gemini");
          } else {
            currentIdx = (currentIdx + 1) % instances.length;
          }
          attempts++;
          continue;
        }
        throw error;
      }
    }

    throw new Error("All provided BYOK keys exhausted quota");
  }

  
 
   
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
      console.error("getAnchorContext error:", err);
      return [];
    }
  }


   
  static buildQuickChatSystemPrompt(
    historicalContext: string,
    highlightedText: string,
  ): string {
    console.log(estimateTokenCount(historicalContext));

    return `You are a surgical AI Assistant specialized in analyzing highlights within a side-modal.
    IMPORTANT- Use this format by default First breifly answer what user asked in one sentence and then format for all answers: [Concept] - [1-sentence definition]. Key points: [bullet points].YTou can check USER'S Query to see if user explitly asked in detail explanation you could provide detail explanation
     When providing code, always use fenced code blocks with the language specified
     IF User asked detailed explanation or user says user doesnt understand the concept Use below Rules that i given
- Use only short, minimal inline comments in code. Do NOT use JSDoc, @param, @returns, or block comment annotations
- For inline code references, use single backticks
- When emphasizing important information, warnings, or tips, use GitHub-style Markdown callouts (e.g., \`> [!NOTE]\`, \`> [!TIP]\`, \`> [!IMPORTANT]\`, \`> [!WARNING]\`, \`> [!CAUTION]\`)
- Separate callouts with blank lines for proper rendering
- For math and chemistry equations, use KaTeX formatting. Use \`$$\` for block equations and \`$\` for inline equations
- IMPORTANT ! Generate Appropritate emojis for titles and subtitles according to the context

[Rules for plantuml diagram below]
 - When the user asks for explanation or teaching,  and user query needs visual explanation then only generate a PlantUML diagram.
 Dont make complex UML diagrams if user not asked for explicitly create SIMPLE Diagrams if user query need complex or flexible to explain user query draw flexible diagrams.
 CRITICAL SYNTAX RULES TO AVOID "assumed to be activity diagram" ERRORS:
   - For Activity Diagrams: ALWAYS use modern syntax ('start', 'stop', ':Activity Name;', 'if (cond) then (yes)'). NEVER use the legacy '(*)' syntax!
   - For State/Flow Diagrams: Use '[*]' for start/end and '-->' for transitions (e.g., 'State1 --> State2'). NEVER use '(*)'.
   - Never mix legacy activity syntax with standard sequence arrows.
 Never connect quoted labels directly.
 Never mix rectangle/node/component/participant.
 Use the code block: \\\`\\\`\\\`plantuml ... \\\`\\\`\\\`.
 Always start with '@startuml' and end with '@enduml'.
 IMPORTANT Use direction of drawing or flow means is it LEFT to RIGHT or TOp to BOTTOM determine by user Query/message and determine BEST direction
 Use 'skinparam' to ensure a professional look:
    skinparam backgroundcolor transparent
    skinparam shadowing false
    skinparam monochrome true
    skinparam packageStyle rectangle
    CRITICAL: In Sequence Diagrams, use only -> for solid arrows or --> for dotted arrows. Never use -- or ->> as they may cause "Illegal sequence arrow" errors.
 Keep labels concise (max 5-7 words per node) and DO NOT OVERLAPS Labels it should be readable.
 If user explicitly asked for step by step explanation generate mutiple diagrams so that user could understand the concept 
 IMPORTANT Background must be transparent for plantuml
 
---
HISTORICAL CONTEXT use historical context to answer user questions(for background only):
${historicalContext}

USER'S HIGHLIGHT (your primary focus):
"${highlightedText}"
---
RESPONSE GUIDELINES:
- DEFAULT:IMPORTANT Be brief. Use crisp bullet points and short, punchy sentences and give example according to the context..
- DO NOT PROVIDE DETAILED EXPLANATION. ONLY provide an expansive/detailed explanation if the user specifically asks to explanation in detail".
.`;
  }

  
 
   
  static async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    } catch (error) {
      console.error("Error converting image URL to base64:", error);
      return "";
    }
  }
}
