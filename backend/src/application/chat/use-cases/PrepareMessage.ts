import { AppError } from "../../../utils/AppError";
import { cleanLLMResponse } from "../../../utils/cleanResponse";
import { IVectorRepository } from "../../../domain/vector/repositories/IVectorRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { IEmbeddingService } from "../../common/ports/IEmbeddingService";
import CONTEXT_WINDOW from "../../../constants/contextWindow";
import { systemInstruction } from "../../../config/AIConfig";
import { redisConfig, redisConnection } from "../../../config/redis";
import { ILogger } from "../../common/ports/ILogger";
import { injectable, inject } from "tsyringe";
import { IPrepareMessageUseCase } from "./interfaces";
import { getTokenInfo } from "../../../utils/tokenCounter";
import { AIService } from "../../../services/AIService";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IGlobalProfile } from "../../../domain/auth/entities/User";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { IUploadedDocumentRepository } from "../../../domain/chat/repositories/IUploadedDocumentRepository";

@injectable()
export class PrepareMessage implements IPrepareMessageUseCase {
  constructor(
    @inject("IVectorRepository") private vectorRepository: IVectorRepository,
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IFolderRepository") private folderRepository: IFolderRepository,
    @inject("IUploadedDocumentRepository")
    private uploadedDocumentRepository: IUploadedDocumentRepository,
    @inject("IEmbeddingService") private embeddingService: IEmbeddingService,
    @inject("ILogger") private logger: ILogger,
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

  private buildProfileSection(profile: IGlobalProfile): string | null {
    const lines: string[] = [];

    if (profile.user_name) lines.push(`- Name: ${profile.user_name}`);
    if (profile.role) lines.push(`- Role: ${profile.role}`);
    if (profile.expertise_level)
      lines.push(`- Expertise Level: ${profile.expertise_level}`);
    if (profile.response_style)
      lines.push(`- Preferred Response Style: ${profile.response_style}`);
    if (profile.location) lines.push(`- Location: ${profile.location}`);
    if (profile.tech_stack?.length > 0)
      lines.push(`- Tech Stack: ${profile.tech_stack.join(", ")}`);
    if (profile.environment?.length > 0)
      lines.push(`- Environment: ${profile.environment.join(", ")}`);
    if (profile.current_projects?.length > 0)
      lines.push(`- Current Projects: ${profile.current_projects.join(", ")}`);
    if (profile.long_term_goals?.length > 0)
      lines.push(`- Long-Term Goals: ${profile.long_term_goals.join(", ")}`);
    if (profile.constraints?.length > 0)
      lines.push(`- Known Constraints: ${profile.constraints.join(", ")}`);
    if (profile.user_preferences?.length > 0)
      lines.push(`- Preferences: ${profile.user_preferences.join(", ")}`);
    if (profile.entities?.length > 0)
      lines.push(`- Key Entities: ${profile.entities.join(", ")}`);

    if (lines.length === 0) return null;

    return `\n\n--- [GLOBAL USER PROFILE / PERSISTENT MEMORY] ---
The following is the user's persistent profile gathered across all conversations YOU may can use it if it only ralated and relevent to answer user query OTHERWISE IGNORE IT. 
${lines.join("\n")}`;
  }

  private async getFolderBehaviorRecursively(
    folderId: string | null,
    userId: string,
  ): Promise<string | null> {
    if (!folderId) return null;

    try {
      const folder = await this.folderRepository.findByIdAndUserId(
        folderId,
        userId,
      );
      if (!folder) return null;

      if (
        folder.behavior?.current?.content &&
        folder.behavior.current.content.trim() !== ""
      ) {
        return folder.behavior.current.content;
      }

      return await this.getFolderBehaviorRecursively(folder.parentId, userId);
    } catch (err) {
      this.logger.error("Error recursively finding folder behavior:", err);
      return null;
    }
  }

  async execute(input: import("../dtos/chat.dto").PrepareMessageInputDTO) {
    const {
      chatId,
      userId,
      userMessage,
      mode,
      model,
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

    // most recent at the topp
    let recentMessages = await this.messageRepository.findRecentByChatId(
      chatId,
      CONTEXT_WINDOW,
    );

    let deficit = CONTEXT_WINDOW - recentMessages.length;
    let parentChatId: string | null = chat.contextParent?._id || null;
    let safetyDepth = 0;
    let map = new Map();
    let parentSummary = null;

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

      if (!parentSummary) {
        parentSummary = parentChat?.summary;
      }

      if (parentChat) {
        map.set(parentChat._id, {
          count: parentChat.unsummarizedCount,
          messages: [...parentMessages],
        });
        parentChatId = parentChat.contextParent?._id || null;
      } else {
        parentChatId = null;
      }

      safetyDepth++;
    }

    this.logger.debug(`Retrieved embeddings map`, { mapSize: map?.size || 0 });

    // oldest > newest
    recentMessages.reverse();

    const recentMessagesText = recentMessages
      .map(
        (m: any) =>
          `${this.stripP5CodeBlocks(m.content)}${m.imageUrl ? `\nAttached image URL: ${m.imageUrl}` : ""}`,
      )
      .join("\n");

    const MAX_EMBEDDING_TOKENS = 1024;
    const tokenInfo = getTokenInfo(normalizedMessage, MAX_EMBEDDING_TOKENS);

    if (tokenInfo.isExceeded) {
      this.logger.warn(`Query text exceeds token limit`, {
        maxTokens: MAX_EMBEDDING_TOKENS,
        estimatedTokens: tokenInfo.estimatedTokens,
        userId,
      });
    } else {
      this.logger.debug(`Query token usage`, {
        estimatedTokens: tokenInfo.estimatedTokens,
        maxTokens: MAX_EMBEDDING_TOKENS,
      });
    }

    const chatIdsToSearch: string[] = [chatId];
    const inheritedSummaries: { title: string; summary: string }[] = [];

    let currentParentId: string | null = chat.contextParent?._id || null;
    let depth = 0;
    let flag = true;

    while (currentParentId && depth < 50) {
      const pChat = await this.chatRepository.findByIdAndUserId(
        currentParentId,
        userId,
      );
      if (!pChat) break;

      const parentIdStr = pChat._id.toString();
      if (!chatIdsToSearch.includes(parentIdStr)) {
        chatIdsToSearch.push(parentIdStr);

        if (!chat.summary && pChat.summary && flag) {
          inheritedSummaries.unshift({
            title: pChat.title || "Inherited Chat",
            summary: pChat.summary,
          });
          flag = false;
        }
      }

      currentParentId = pChat.contextParent?._id || null;
      depth++;
    }

    console.log(
      `\n [BRANCH ARCHITECTURE] Searching across ${chatIdsToSearch.length} chats in full lineage:`,
      chatIdsToSearch,
    );


    const [queryVec, shouldSearch] = await Promise.all([
      tokenInfo.isExceeded
        ? Promise.resolve(null)
        : this.embeddingService
            .embed(normalizedMessage, "RETRIEVAL_QUERY")
            .catch((err: any) => {
              this.logger.warn("Embedding failed, skipping vector search", { error: err?.message });
              return null;
            }),
      AIService.shouldUseInternetSearch(normalizedMessage, userId).catch(
        (err: any) => {
          console.warn("[PrepareMessage] Internet search router failed, skipping:", err?.message);
          return false;
        },
      ),
    ]);
    
    const finalCodeQueryVector = queryVec;
    const finalDescQueryVector = queryVec;

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

    
    const activeDocuments = await this.uploadedDocumentRepository.findByChatIds(chatIdsToSearch);
    const activeContentHashes = activeDocuments.map((doc) => doc.contentHash);

    const vectorSearchPromise = canRunVectorSearch
      ? Promise.all([
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
            activeContentHashes,
          ),
        ]).catch((err: any) => {
          this.logger.warn("Vector search failed, skipping RAG context", { error: err?.message });
          return [[], [], []] as [any[], any[], any[]];
        })
      : Promise.resolve([[], [], []] as [any[], any[], any[]]);

    const internetContextPromise = queryVec
      ? AIService.getInternetContextWithPrecomputedDecision(
          normalizedMessage,
          queryVec,
          shouldSearch,
        )
      : Promise.resolve("");

    const userPromise = this.userRepository.findById(userId).catch((err: any) => {
      this.logger.warn("User profile fetch failed, skipping personalization", { error: err?.message });
      return null;
    });

    const folderBehaviorPromise = this.getFolderBehaviorRecursively(
      chat.folderId,
      userId,
    );

    const [
      [rawSimilarCode, chatContextStats, documentChunks],
      internetContext,
      user,
      folderBehavior,
    ] = await Promise.all([
      vectorSearchPromise,
      internetContextPromise,
      userPromise,
      folderBehaviorPromise,
    ]);

    this.logger.debug(`Raw document chunks retrieved`, {
      chunkCount: documentChunks?.length || 0,
    });

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

    const profile = user?.globalProfile;
    if (profile) {
      const profileSection = this.buildProfileSection(profile);
      if (profileSection) {
        dynamicSystemInstruction += profileSection;
      }
    }

    if (folderBehavior) {
      dynamicSystemInstruction += `\n\n--- [FOLDER BEHAVIOR / SYSTEM DIRECTIVES] ---\nThis chat is organized inside a folder that has specific custom rules and custom behavior directives. You MUST follow these directives strictly:\n${folderBehavior}`;
    }

    if (inheritedSummaries.length > 0) {
      dynamicSystemInstruction += `\n\n--- [INHERITED KNOWLEDGE FROM PARENT CONTEXT] ---\nThe following summaries provide background context from parent chats this conversation explicitly inherits from:`;
      inheritedSummaries.forEach((s) => {
        dynamicSystemInstruction += `\n\n[Context from "${s.title}"]:\n${s.summary}`;
      });
    }

    if (chat.summary) {
      this.logger.debug(`Chat summary injected`, {
        summaryLength: chat.summary?.length || 0,
        chatId,
      });
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
      dynamicSystemInstruction += `VISUAL MODE ACTIVE

PRIMARY GOAL:
Teach the concept accurately. Visual beauty is secondary to correctness.
Every animation, movement, color change, highlight, and interaction must represent actual logical state changes in the underlying concept.
IMPORTANT:
- Generate P5 visualizations ONLY when the user explicitly asks for a visualization.
- Do NOT generate explanation and visualization together.
- Return either:
  1. A visualization (single \`\`\`p5\`\`\` block only), OR
  2. A normal explanation.
- Never return both unless the user explicitly asks for both.
-each explanation of visualization should given with text size of 15px

CANVAS & LAYOUT (CRITICAL):
- Canvas: createCanvas(windowWidth, windowHeight);
- Add:
  function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
  }
LAYOUT ZONES:
HEADER:
- y = 0 → 50
- Title, legend, visualization mode

CONTROLS:
- y = 50 → 90
- MUST contain:
  Pause/Resume
  Prev
  Next
  Reset
  atleast these buttons should be provided and it should be clickable
BODY:
- y = 100 → height - 50
- All educational content and animations
- Never draw educational content outside this zone

FOOTER:
- y = height - 50 → height
- Status text font size 20px
- Step counter
- Current state description



OUTPUT RULES:
- Global p5 mode only.
- Complete runnable code.
- No external libraries.
- No markdown explanation.
- Output ONLY one \`\`\`p5\`\`\` block when visualization mode is triggered.



If any answer is NO, improve the visualization before returning it.`;
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
        this.logger.error(`Failed to convert image URL to base64`, error, {
          imageUrl: url,
        });
        return { base64: "", mimeType: "image/jpeg" };
      }
    };

    const contents: any[] = [];

    for (const msg of recentMessages) {
      let sanitizedContent = this.stripP5CodeBlocks(msg.content);

      if (msg.role === "model") {
        // Skip leading model turns — Gemini requires conversation to start with user
        if (contents.length === 0) continue;
        sanitizedContent = cleanLLMResponse(sanitizedContent);
        if (sanitizedContent) {
          contents.push({
            role: "model",
            parts: [{ text: sanitizedContent }],
          });
        }
      } else {
        const parts: any[] = [];
        if (sanitizedContent) {
          parts.push({ text: sanitizedContent });
        }

        if (msg.imageUrl) {
          try {
            const imageData = await urlToBase64(msg.imageUrl);
            if (imageData.base64) {
              parts.push({
                inlineData: {
                  mimeType: imageData.mimeType,
                  data: imageData.base64,
                },
              });
            }
          } catch (error) {
            this.logger.error(`Error processing image in message`, error, {
              imageUrl: msg.imageUrl,
            });
          }
        }

        if (parts.length > 0) {
          contents.push({
            role: "user",
            parts,
          });
        }
      }
    }

    // internetContext is pre-resolved in the parallel execution step
    if (internetContext) {
      const lastTurn = contents[contents.length - 1];
      if (lastTurn && lastTurn.role === "user" && lastTurn.parts) {
        const lastTextPart = lastTurn.parts.find(
          (p: any) => p.text && typeof p.text === "string",
        );
        if (lastTextPart) {
          lastTextPart.text += internetContext;
        } else {
          lastTurn.parts.push({ text: internetContext });
        }
      }
    }

    return {
      chat,
      contents,
      systemInstruction: dynamicSystemInstruction,
      userMessageId: userMsg._id.toString(),
      parentContext: map,
      parentSummary: parentSummary ?? null,
      model,
    };
  }
}
