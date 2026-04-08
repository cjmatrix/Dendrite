import { Chat } from '../../../models/Chat';
import { Message } from '../../../models/Message';
import { AppError } from '../../../utils/AppError';
import { IVectorRepository } from '../../../domain/vector/repositories/IVectorRepository';
import { generateEmbedding } from '../../../utils/embedding';
import CONTEXT_WINDOW from '../../../constants/contextWindow';
import { systemInstruction } from '../../../config/AIConfig';

export class PrepareMessage {
  constructor(private vectorRepository: IVectorRepository) {}

  async execute(
    chatId: string,
    userId: string,
    userMessage: string,
    mode?: string,
    codeQueryVector?: number[],
    descQueryVector?: number[],
    imageUrl?: string,
  ) {
    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    const normalizedMessage = (userMessage || "").trim() || "Analyze this image";
    const userMsg = await Message.create({
      chatId,
      userId,
      role: "user",
      content: normalizedMessage,
      imageUrl: imageUrl || undefined,
    });

    // (most recent at the top)
    let recentMessages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(CONTEXT_WINDOW)
      .lean();

    const deficit = CONTEXT_WINDOW - recentMessages.length;

    if (deficit > 0 && chat?.contextParent) {
      const parentMessages = await Message.find({ chatId: chat.contextParent })
        .sort({ createdAt: -1 })
        .limit(deficit)
        .lean();

      // (older) + current messages (newer)
      recentMessages = [...recentMessages, ...parentMessages];
    }

    // [oldest -> newest]
    recentMessages.reverse();

    const recentMessagesText = recentMessages
      .map((m: any) => `${m.content}${m.imageUrl ? `\nAttached image URL: ${m.imageUrl}` : ""}`)
      .join("\n");


    const finalCodeQueryVector = codeQueryVector || await generateEmbedding(normalizedMessage, "CODE_RETRIEVAL_QUERY");
    const finalDescQueryVector = descQueryVector || await generateEmbedding(normalizedMessage, "RETRIEVAL_QUERY");

    const chatIdsToSearch: string[] = [chatId];
    const inheritedSummaries: { title: string; summary: string }[] = [];

    let currentParentId = chat.contextParent;
    let depth = 0;
    while (currentParentId && depth < 5) {
      const pChat = await Chat.findOne({ _id: currentParentId, userId }).select("title summary contextParent").lean();
      if (!pChat) break;

      const parentIdStr = pChat._id.toString();
      if (!chatIdsToSearch.includes(parentIdStr)) {
        chatIdsToSearch.push(parentIdStr);
        
        if (pChat.summary) {
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

    console.log(`\n🌲 [BRANCH ARCHITECTURE] Searching across ${chatIdsToSearch.length} chats in full lineage:`, chatIdsToSearch);

    const [rawSimilarCode, chatContextStats] = await Promise.all([
      this.vectorRepository.searchSimilarCode(finalCodeQueryVector, finalDescQueryVector, userId, chatIdsToSearch),
      this.vectorRepository.searchSimilarChatChunk(finalDescQueryVector, userId, chatIdsToSearch),
    ]);

    // --- DIAGNOSTIC LOGS ---
    console.log(`\n🔍 [RAG DIAGNOSTICS]`);
    console.log(`📡 User Message: "${normalizedMessage}"`);
    console.log(`🧠 Long-Term Facts Found: ${chatContextStats.length}`);
    chatContextStats.slice(0, 3).forEach((f, i) => {
      console.log(`   [Fact ${i + 1}] Score: ${f.score.toFixed(3)} | Content: ${f.fact.fact.substring(0, 100)}...`);
    });
    console.log(`💻 Code Snippets Found: ${rawSimilarCode.length}`);
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

    let dynamicSystemInstruction = systemInstruction;

    if (inheritedSummaries.length > 0) {
      dynamicSystemInstruction += `\n\n--- [INHERITED KNOWLEDGE FROM PARENT CONTEXT] ---\nThe following summaries provide background context from parent chats this conversation explicitly inherits from:`;
      inheritedSummaries.forEach((s) => {
        dynamicSystemInstruction += `\n\n[Context from "${s.title}"]:\n${s.summary}`;
      });
    }

    if (chat.summary) {
      console.log(chat.summary,"📡📡📡📡📡📡📡📡📡📡")
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

    if (mode === "visual") {
      dynamicSystemInstruction += `\n\nCRITICAL INSTRUCTION: The user has explicitly selected "Visual Mode". 
- If the user asks to CREATE, EDIT, or MODIFY a visualization, you MUST output the raw valid JS code inside a single \`\`\`p5\`\`\` fenced code block, with NO explanations.
- If the user asks a FOLLOW-UP question, asks for an EXPLANATION, or discusses the behavior of the current visual, you MUST answer politely with normal conversational text and explanations, and DO NOT output a \`\`\`p5\`\`\` block unless they explicitly ask for a code change.

Assume your code will be executed in a blank environment. You should write standard global p5 code (e.g., function setup() { createCanvas(600, 400); } function draw() { ... }).
CRUCIAL: You MUST include a functional Pause/Resume button and also Next and Previous buttons with explanation of each steps in your sketch. You can use p5's \`createButton()\` or draw it manually using \`rect()\`. IF you use \`createButton()\`, you MUST explicitly call \`.position(x, y)\` (e.g., \`button.position(10, 10)\`) to place it safely over the canvas, otherwise it will corrupt the HTML flex layout and overlap elements! The button MUST successfully toggle between \`noLoop()\` to pause and \`loop()\` to resume the animation. Make everything interactive and look beautiful using modern colors!`;
    }
    else{
      dynamicSystemInstruction += `\n\nIMPORTANT: The user is currently in GENERAL mode. Do NOT produce any raw p5 code blocks or runnable visualization code. Under no circumstances output a fenced code block labeled \`p5\` or any JavaScript code intended to be executed as a visualization. If the user asks about a previous visualization, provide only a high-level textual description or pseudo-code, and NEVER include runnable p5 code unless the user explicitly switches to Visual Mode.`;
    }

    // Helper function image URL to base64
    const urlToBase64 = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString("base64");
      } catch (error) {
        console.error("Error converting image URL to base64:", error);
        return "";
      }
    };

    const contents: any[] = [
      { text: dynamicSystemInstruction },
    ];

    for (const msg of recentMessages) {
      if (msg.role === "model") {
        contents.push({ text: msg.content });
      } else {
        contents.push({ text: msg.content });
        if (msg.imageUrl) {
          try {
            const base64Data = await urlToBase64(msg.imageUrl);
            if (base64Data) {
              contents.push({
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              });
            }
          } catch (error) {
            console.error("Error processing image:", error);
          }
        }
      }
    }

    return { chat, contents, userMessageId: userMsg._id.toString() };
  }
}
