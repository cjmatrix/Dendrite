import { AppError } from "../../../utils/AppError";
import { IVectorRepository } from "../../../domain/vector/repositories/IVectorRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { embeddingService } from "../../../services/EmbeddingService";
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

@injectable()
export class PrepareMessage implements IPrepareMessageUseCase {
  constructor(
    @inject("IVectorRepository") private vectorRepository: IVectorRepository,
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IFolderRepository") private folderRepository: IFolderRepository,
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
    if (profile.expertise_level) lines.push(`- Expertise Level: ${profile.expertise_level}`);
    if (profile.response_style) lines.push(`- Preferred Response Style: ${profile.response_style}`);
    if (profile.location) lines.push(`- Location: ${profile.location}`);
    if (profile.tech_stack?.length > 0) lines.push(`- Tech Stack: ${profile.tech_stack.join(", ")}`);
    if (profile.environment?.length > 0) lines.push(`- Environment: ${profile.environment.join(", ")}`);
    if (profile.current_projects?.length > 0) lines.push(`- Current Projects: ${profile.current_projects.join(", ")}`);
    if (profile.long_term_goals?.length > 0) lines.push(`- Long-Term Goals: ${profile.long_term_goals.join(", ")}`);
    if (profile.constraints?.length > 0) lines.push(`- Known Constraints: ${profile.constraints.join(", ")}`);
    if (profile.user_preferences?.length > 0) lines.push(`- Preferences: ${profile.user_preferences.join(", ")}`);
    if (profile.entities?.length > 0) lines.push(`- Key Entities: ${profile.entities.join(", ")}`);

    if (lines.length === 0) return null;

    return `\n\n--- [GLOBAL USER PROFILE / PERSISTENT MEMORY] ---
The following is the user's persistent profile gathered across all conversations. Use this to personalize responses, adapt explanations to their expertise level, and maintain awareness of their ongoing projects and preferences.
${lines.join("\n")}`;
  }

  private async getFolderBehaviorRecursively(folderId: string | null, userId: string): Promise<string | null> {
    if (!folderId) return null;

    try {
      const folder = await this.folderRepository.findByIdAndUserId(folderId, userId);
      if (!folder) return null;

      if (folder.behavior?.current?.content && folder.behavior.current.content.trim() !== "") {
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
    let parentSummary=null
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

      if(!parentSummary){
        parentSummary=parentChat?.summary
      }

      if (parentChat) {
        map.set(parentChat._id, {count:parentChat.unsummarizedCount,messages:[...parentMessages]});
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

    let finalCodeQueryVector ;
    let finalDescQueryVector ;
    if (!finalCodeQueryVector || !finalDescQueryVector) {
      const MAX_EMBEDDING_TOKENS = 1024;
      const tokenInfo = getTokenInfo(normalizedMessage, MAX_EMBEDDING_TOKENS);

      if (tokenInfo.isExceeded) {
        this.logger.warn(`Query text exceeds token limit`, { maxTokens: MAX_EMBEDDING_TOKENS, estimatedTokens: tokenInfo.estimatedTokens, userId });
      } else {
        this.logger.debug(`Query token usage`, { estimatedTokens: tokenInfo.estimatedTokens, maxTokens: MAX_EMBEDDING_TOKENS });
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

    let currentParentId: string | null = chat.contextParent?._id || null;
    let depth = 0;
    let flag=true;
    while (currentParentId && depth < 50) {
      const pChat = await this.chatRepository.findByIdAndUserId(
        currentParentId,
        userId,
      );
      if (!pChat) break;

      const parentIdStr = pChat._id.toString();
      if (!chatIdsToSearch.includes(parentIdStr)) {
        chatIdsToSearch.push(parentIdStr);

        if (!chat.summary&&pChat.summary && flag) {
          
          inheritedSummaries.unshift({
            title: pChat.title || "Inherited Chat",
            summary: pChat.summary,
          });
          flag=false;
        }
      }

      currentParentId = pChat.contextParent?._id || null;
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

    this.logger.debug(`Raw document chunks retrieved`, { chunkCount: documentChunks?.length || 0 });
 
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

  
    const user = await this.userRepository.findById(userId);
    const profile = user?.globalProfile;
    if (profile) {
      const profileSection = this.buildProfileSection(profile);
      if (profileSection) {
        dynamicSystemInstruction += profileSection;
      }
    }

    const folderBehavior = await this.getFolderBehaviorRecursively(chat.folderId, userId);
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
      this.logger.debug(`Chat summary injected`, { summaryLength: chat.summary?.length || 0, chatId });
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
//
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

LOGIC-FIRST VISUALIZATION PRINCIPLE:
- Prioritize conceptual accuracy over visual effects.
- Every visual element must correspond to a real entity in the system being taught.
- Avoid decorative animations that do not communicate information.
- Focus on state transitions, data flow, execution flow, relationships, dependencies, and transformations.
- The visualization should allow a learner to understand HOW the system works step-by-step.
- If forced to choose between prettier visuals and clearer logic, choose clearer logic.

CONSISTENT VISUAL LANGUAGE (USE FOR ALL TOPICS):
- Maintain the same design language across all visualizations.
- Nodes = entities/objects/data structures.
- Arrows = communication, movement, references, or control flow.
- Highlighted node = currently active element.
- Dashed arrow = indirect relationship.
- Glow/highlight = current execution focus.
- Dimmed elements = inactive state.
- Green = success/completed state.
- Amber = waiting/intermediate state.
- Red = error/conflict state.
- Indigo (#5046E5) = primary active operation.
- Use the same meanings consistently across all visualizations.

EDUCATIONAL REQUIREMENTS:
- Visualize processes step-by-step.
- Show intermediate states whenever possible.
- Never skip important transitions.
- Include labels for every important component.
- Include annotations when a state changes.
- Show execution order clearly.
- Prefer slower, understandable animations over flashy motion.

SCOPE:
Visualize ANY topic:
- Physics
- Chemistry
- Biology
- Mathematics
- Data Structures
- Algorithms
- Operating Systems
- Memory Management
- CPU Scheduling
- Networking
- Databases
- System Design
- Architecture
- Circuits
- Astronomy
- Statistics
- Scientific Processes

CANVAS & LAYOUT (CRITICAL):
- Canvas: createCanvas(windowWidth, windowHeight);
- Add:
  function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
  }

DRAW REQUIREMENTS:
- Always call:
  background('#F8FAFC');
  as the first line of draw().

THEME (CONSTANT FOR ALL VISUALIZATIONS):
- Background: #F8FAFC
- Primary Text: #1E293B
- Secondary Text: #475569
- Cards/Containers: #FFFFFF
- Borders: #E2E8F0
- Primary Accent: #5046E5

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

BODY:
- y = 100 → height - 50
- All educational content and animations
- Never draw educational content outside this zone

FOOTER:
- y = height - 50 → height
- Status text
- Step counter
- Current state description

INTERACTION:
- Add clickable buttons using mousePressed().
- Pause/Resume must stop logical progression.
- Prev/Next must navigate through logical steps.
- Reset must restore the initial state.
- Active step should always be visually highlighted.

OUTPUT RULES:
- Global p5 mode only.
- Complete runnable code.
- No external libraries.
- No markdown explanation.
- Output ONLY one \`\`\`p5\`\`\` block when visualization mode is triggered.

QUALITY CHECK BEFORE OUTPUT:
1. Is the logic accurate?
2. Does every visual element represent a real concept?
3. Can a student understand the process step-by-step?
4. Are controls present?
5. Is the layout respecting the defined zones?
6. Is the visualization using the constant theme?
7. Are state transitions clearly visible?

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
        this.logger.error(`Failed to convert image URL to base64`, error, { imageUrl: url });
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
            this.logger.error(`Error processing image in message`, error, { imageUrl: msg.imageUrl });
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

    return { chat, contents, userMessageId: userMsg._id.toString() ,parentContext:map,parentSummary: parentSummary ?? null};
  }
}
