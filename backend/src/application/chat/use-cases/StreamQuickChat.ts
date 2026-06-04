import { injectable, inject } from "tsyringe";
import { IStreamQuickChatUseCase } from "./interfaces";
import { StreamQuickChatInputDTO } from "../dtos/chat.dto";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { IAIService } from "../../common/ports/IAIService";
import { ILogger } from "../../common/ports/ILogger";
import { AppError } from "../../../utils/AppError";
import CONTEXT_WINDOW from "../../../constants/contextWindow";

@injectable()
export class StreamQuickChat implements IStreamQuickChatUseCase {
  constructor(
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
    @inject("IAIService") private aiService: IAIService,
    @inject("ILogger") private logger: ILogger
  ) {}

  async execute(input: StreamQuickChatInputDTO): Promise<AsyncIterable<any>> {
    const { chatId, anchorMessageId, highlightedText, quickChatHistory } = input;

    const recentHistory = (quickChatHistory || []).slice(-CONTEXT_WINDOW);

    const backgroundContext = await this.aiService.getAnchorContext(
      chatId,
      anchorMessageId,
      this.messageRepository
    );

    const historicalString = backgroundContext
      .map((msg: any) => `[${msg.role}]: ${msg.content}`)
      .join("\n\n");

    const systemPrompt = this.aiService.buildQuickChatSystemPrompt(
      historicalString,
      highlightedText
    );

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...recentHistory.map((msg: any) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    ];

    try {
      return await this.aiService.streamAIContent(contents, "gemini-2.5-flash");
    } catch (error: any) {
      this.logger.error("AI streaming failed", error, { contents });
      throw new AppError("All your provided Gemini API keys have exceeded their free-tier limits. Please wait, or add a new key.", 429);
    }
  }
}
