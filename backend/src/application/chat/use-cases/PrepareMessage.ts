import { AppError } from "../../../utils/AppError";
import { IVectorRepository } from "../../../domain/vector/repositories/IVectorRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { embeddingService } from "../../../services/EmbeddingService";
import CONTEXT_WINDOW from "../../../constants/contextWindow";
import { systemInstruction } from "../../../config/AIConfig";
import { redisConfig, redisConnection } from "../../../config/redis";
import { injectable, inject } from "tsyringe";
import { IPrepareMessageUseCase } from "./interfaces";
import { getTokenInfo } from "../../../utils/tokenCounter";
import { AIService } from "../../../services/AIService";

@injectable()
export class PrepareMessage implements IPrepareMessageUseCase {
  constructor(
    @inject("IVectorRepository") private vectorRepository: IVectorRepository,
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
  ) {}

  private stripP5CodeBlocks(text: string): string {
    if (!text) {
      return "";
    }

    return text
      .replace(/```p5\s*\n[\s\S]*?```/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  async execute(input: import("../dtos/chat.dto").PrepareMessageInputDTO) {
    const {
      chatId,
      userId,
      userMessage,
      mode,
      imageUrl,
      fileUrl,
      fileName,
    } = input;
    
    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    const normalizedMessage =
      (userMessage || "").trim() || "Analyze this image";
    const userMsg = await this.messageRepository.create({
      chatId,
      userId,
      role: "user",
      content: normalizedMessage,
      imageUrl: imageUrl || undefined,
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
    });

    // (most recent at the top)
    let recentMessages = await this.messageRepository.findRecentByChatId(
      chatId,
      CONTEXT_WINDOW,
    );

    let deficit = CONTEXT_WINDOW - recentMessages.length;
    let parentChatId = chat.contextParent;
    let safetyDepth = 0;
    let map = new Map();
    while (parentChatId && deficit > 0 && safetyDepth < 100) {
      const parentMessages = await this.messageRepository.findRecentByChatId(
        parentChatId,
        deficit,
      );

      // (older) + current messages (newer)
      recentMessages = [...recentMessages, ...parentMessages];
      deficit = CONTEXT_WINDOW - recentMessages.length;
      const parentChat = await this.chatRepository.findByIdAndUserId(
        parentChatId,
        userId,
      );

      if (parentChat) {
        map.set(parentChat._id, {count:parentChat.unsummarizedCount,messages:[...parentMessages]});
        parentChatId = parentChat.contextParent;
      } else {
        parentChatId = null;
      }

      safetyDepth++;
    }

    console.log(map, "🫐🫐🫐hereeeeeeeeeeeeeeeeeeee");

    // [oldest -> newest]
    recentMessages.reverse();

    const recentMessagesText = recentMessages
      .map(
        (m: any) =>
          `${this.stripP5CodeBlocks(m.content)}${m.imageUrl ? `\nAttached image URL: ${m.imageUrl}` : ""}`,
      )
      .join("\n");

    let finalCodeQueryVector ;
    let finalDescQueryVector ;
    if (!finalCodeQueryVector || !finalDescQueryVector) {
      const MAX_EMBEDDING_TOKENS = 1024;
      const tokenInfo = getTokenInfo(normalizedMessage, MAX_EMBEDDING_TOKENS);

      if (tokenInfo.isExceeded) {
        console.warn(`[Token Limit Warning] Query text exceeds ${MAX_EMBEDDING_TOKENS} tokens. Estimated: ${tokenInfo.estimatedTokens} tokens. Skipping embedding generation.`);
      } else {
        console.log(`[Token Info] Query text: ${tokenInfo.estimatedTokens}/${MAX_EMBEDDING_TOKENS} tokens`);
        const [codeVec, descVec] = await Promise.all([
          embeddingService.embed(normalizedMessage, "CODE_RETRIEVAL_QUERY"),
          embeddingService.embed(normalizedMessage, "RETRIEVAL_QUERY"),
        ]);
        finalCodeQueryVector = codeVec;
        finalDescQueryVector = descVec;
      }
    }

    const chatIdsToSearch: string[] = [chatId];
    const inheritedSummaries: { title: string; summary: string }[] = [];

    let currentParentId = chat.contextParent;
    let depth = 0;
    while (currentParentId && depth < 15) {
      const pChat = await this.chatRepository.findByIdAndUserId(
        currentParentId,
        userId,
      );
      if (!pChat) break;

      const parentIdStr = pChat._id.toString();
      if (!chatIdsToSearch.includes(parentIdStr)) {
        chatIdsToSearch.push(parentIdStr);

        if (pChat.summary && depth <= 1) {
          // Unshift so the oldest ancestors come first in the prompt
          inheritedSummaries.unshift({
            title: pChat.title || "Inherited Chat",
            summary: pChat.summary,
          });
        }
      }

      currentParentId = pChat.contextParent;
      depth++;
    }

    console.log(
      `\n [BRANCH ARCHITECTURE] Searching across ${chatIdsToSearch.length} chats in full lineage:`,
      chatIdsToSearch,
    );

    const canRunVectorSearch =
      Array.isArray(finalCodeQueryVector) &&
      finalCodeQueryVector.length > 0 &&
      Array.isArray(finalDescQueryVector) &&
      finalDescQueryVector.length > 0;

    if (!canRunVectorSearch) {
      console.warn(
        " Embedding vectors missing, skipping vector retrieval for this request.",
      );
    }

    const [rawSimilarCode, chatContextStats, documentChunks] =
      canRunVectorSearch
        ? await Promise.all([
            this.vectorRepository.searchSimilarCode(
              finalCodeQueryVector!,
              finalDescQueryVector!,
              userId,
              chatIdsToSearch,
            ),
            this.vectorRepository.searchSimilarChatChunk(
              finalDescQueryVector!,
              userId,
              chatIdsToSearch,
            ),
            this.vectorRepository.searchDocuments(
              normalizedMessage,
              finalDescQueryVector!,
              userId,
              chatIdsToSearch,
            ),
          ])
        : [[], [], []];

    console.log(documentChunks, "raw document");
 
    console.log(`\n [RAG DIAGNOSTICS]`);
    console.log(` User Message: "${normalizedMessage}"`);
    console.log(` Long-Term Facts Found: ${chatContextStats.length}`);
    chatContextStats.slice(0, 3).forEach((f, i) => {
      console.log(
        `   [Fact ${i + 1}] Score: ${f.score.toFixed(3)} | Content: ${f.fact.fact.substring(0, 100)}...`,
      );
    });
    console.log(` Code Snippets Found: ${rawSimilarCode.length}`);
    console.log(` Document Chunks Found: ${documentChunks.length}`);
    console.log(`------------------------\n`);

    const deduplicatedSimilarCode = rawSimilarCode.filter((item) => {
      return (
        typeof item.content !== "string" &&
        item.content?.code &&
        !recentMessagesText.includes(item.content.code)
      );
    });

    const deduplicatedChatContext = chatContextStats.filter((item) => {
      return item.fact?.fact && !recentMessagesText.includes(item.fact.fact);
    });

    const deduplicatedDocuments = documentChunks.filter((item: any) => {
      return (
        item.document?.text && !recentMessagesText.includes(item.document.text)
      );
    });

    let dynamicSystemInstruction = systemInstruction;

    if (inheritedSummaries.length > 0) {
      dynamicSystemInstruction += `\n\n--- [INHERITED KNOWLEDGE FROM PARENT CONTEXT] ---\nThe following summaries provide background context from parent chats this conversation explicitly inherits from:`;
      inheritedSummaries.forEach((s) => {
        dynamicSystemInstruction += `\n\n[Context from "${s.title}"]:\n${s.summary}`;
      });
    }

    if (chat.summary) {
      console.log(chat.summary, "📡📡📡📡📡📡📡📡📡📡");
      dynamicSystemInstruction += `\n\n--- [ACTIVE CONVERSATION STATE / MIDDLE-LAYER MEMORY] ---\nThis is the active middle-layer summary for your currently ongoing conversation:\n${chat.summary}`;
    }

    if (deduplicatedSimilarCode.length > 0) {
      const contextText = deduplicatedSimilarCode
        .map(
          (item, index) =>
            `[Snippet ${index + 1} - ${item.language}]\n\`\`\`${item.language}\n${item.content.code}\n\`\`\`\nDescription: ${item.content.description}`,
        )
        .join("\n\n");

      dynamicSystemInstruction += `\n\n--- [RELEVANT ARCHIVED CODE SNIPPETS] ---\nThe following code blocks from previous turns might be useful:\n\n${contextText}`;
    }

    if (deduplicatedChatContext.length > 0) {
      const factText = deduplicatedChatContext
        .map((item, index) => `[Fact ${index + 1}]: ${item.fact.fact}`)
        .join("\n\n");

      dynamicSystemInstruction += `\n\n--- [RELEVANT ARCHIVED FACTS] ---\nThese are granular details from deep in the conversation history:\n\n${factText}`;
    }

    if (deduplicatedDocuments.length > 0) {
      const docText = deduplicatedDocuments
        .map((item: any, index: number) => {
          const fileName = item.metadata?.fileName || "Unknown File";
          const text = item.document?.text || "";
          const headings = item.document?.headings
            ? item.document.headings.join(" > ")
            : "";
          const heading = headings ? `\nSection: ${headings}` : "";
          return `[Document ${index + 1}] ${fileName}${heading}\n${text.substring(0, 500)}${text.length > 500 ? "..." : ""}`;
        })
        .join("\n\n");

      dynamicSystemInstruction += `\n\n=== [PRIMARY SOURCE: UPLOADED DOCUMENTS] ===\nIMPORTANT: The user has uploaded specific documents. Your responses MUST be grounded exclusively in the following document excerpts. Do NOT rely on general knowledge or external sources unless the user explicitly asks. If the user's question cannot be answered using ONLY the provided documents, clearly state: "This information is not covered in the uploaded documents and then you may free to use general knowledge."\n\n${docText}\n\nSOURCE CONSTRAINT: Base your entire response on the above document content. Cite the document name and section when providing information.`;
    }

    if (mode === "visual") {
      dynamicSystemInstruction += `\n\n VISUAL MODE ACTIVE
      IMPORTANT GENERATE P5 VISUALS ONLY IF USER EXPLICITLY ASKED FOR VISUALIZATION and do not gnerete visualization along with explanation Generate p5 code or Explanation not both.
- To CREATE/EDIT a visualization → output ONLY raw JavaScript in one \`\`\`p5\`\`\` block, no extra text.
- For conceptual/explanation questions → answer in normal text, no \`\`\`p5\`\`\` block unless explicitly requested.
- If the user provides code to visualize → give explanation with code snippets alongside the visualization.

 SCOPE: Visualize ANY topic — physics, chemistry, biology, math, data structures, algorithms, sorting, graphs, recursion, system architecture, code execution, memory, circuits, astronomy, geometry, statistics, or any educational/scientific concept. Prefer animations that teach step-by-step, not just decorative motion.

 CANVAS & LAYOUT (CRITICAL — prevents overlap):
- Canvas: \`createCanvas(windowWidth, windowHeight);\` — fills the iframe exactly.
- Add \`function windowResized() { resizeCanvas(windowWidth, windowHeight); }\`
-Background: Always call background('#F8FAFC') as the first line of draw().

-Typography: Text should be high-contrast for readability. Use #1E293B for primary labels/titles and #475569 for secondary information.

Shapes & Components:

-Use a White (#FFFFFF) fill with a thin light-grey stroke (#E2E8F0) for containers or cards.
-Accents: Use a Vibrant Indigo (#5046E5) for key interactive elements.

Visual Style: Maintain a clean, airy aesthetic with plenty of padding and space between visual nodes.
- LAYOUT ZONES (use these Y boundaries to prevent overlap):
  • HEADER zone: y = 0 → 50. Title, mode label, legend go here.
  • IMPORTANT CONTROLS zone: y = 50 → 90. Buttons (Pause/Resume, Prev, Next, Reset Its IMPORTANT ATLEAST TO ADD THESE BUTTONS) go here. Draw them as clickable rects with \`mousePressed()\`.
  • BODY zone: y = 100 → height - 50. ALL drawings, animations, graphs live here. Never draw content above y=100 or below height-50.
  • FOOTER zone: y = height-50 → height. Status text, step counters, annotations.
- Center content horizontally in the body zone. Use \`width/2\` as anchor.
- Keep labels readable: min 14px text, adequate contrast. Don't overcrowd — space elements with generous padding.
 INTERACTION:
- For multi-step animations, add Pause/Resume + Prev/Next buttons in the CONTROLS zone.
- Highlight the active element/step with a glow or distinct color.
- Add labels, legends, units, and annotations where they help understanding.

 OUTPUT RULES:
- Global p5 mode (\`setup\`, \`draw\`, helper functions). No external libraries.
- Code must be complete and runnable as-is.`;
    } else {
      dynamicSystemInstruction += `\n\nIMPORTANT: The user is currently in GENERAL mode. Do NOT produce any raw p5 code blocks or runnable visualization code. Under no circumstances output a fenced code block labeled \`p5\` or any JavaScript code intended to be executed as a visualization. If the user asks about a previous visualization, provide only a high-level textual description or pseudo-code, and NEVER include runnable p5 code unless the user explicitly switches to Visual Mode.`;
    }

  
    const urlToBase64 = async (
      url: string,
    ): Promise<{ base64: string; mimeType: string }> => {
      try {
        const cacheJSON = await redisConnection.get(`image:${url}`);
        if (cacheJSON) {
          const cached = JSON.parse(cacheJSON);
          return {
            base64: cached.data || "",
            mimeType: cached.mimeType || "image/jpeg",
          };
        }

        const response = await fetch(url);
        const mimeType =
          response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        await redisConnection.setex(
          `image:${url}`,
          604800,
          JSON.stringify({ data: base64, mimeType }),
        );

        return { base64, mimeType };
      } catch (error) {
        console.error("Error converting image URL to base64:", error);
        return { base64: "", mimeType: "image/jpeg" };
      }
    };

    const contents: any[] = [{ text: dynamicSystemInstruction }];

    for (const msg of recentMessages) {
      const sanitizedContent = this.stripP5CodeBlocks(msg.content);

      if (msg.role === "model") {
        if (sanitizedContent) {
          contents.push({ text: sanitizedContent });
        }
      } else {
        if (sanitizedContent) {
          contents.push({ text: sanitizedContent });
        }
        if (msg.imageUrl) {
          try {
            const imageData = await urlToBase64(msg.imageUrl);
            if (imageData.base64) {
              contents.push({
                inlineData: {
                  mimeType: imageData.mimeType,
                  data: imageData.base64,
                },
              });
            }
          } catch (error) {
            console.error("Error processing image:", error);
          }
        }
      }
    }

    let internetContext: string | undefined;
    if (finalDescQueryVector) {
      internetContext = await AIService.getInternetContext(normalizedMessage, finalDescQueryVector);
    }

    if (internetContext) {
      for (let i = contents.length - 1; i >= 0; i--) {
        if (contents[i].text && typeof contents[i].text === "string") {
          contents[i].text += internetContext;
          break;
        }
      }
    }

    return { chat, contents, userMessageId: userMsg._id.toString() ,parentContext:map};
  }
}
