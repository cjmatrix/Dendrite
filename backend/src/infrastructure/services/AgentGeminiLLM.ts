// infrastructure/services/GeminiLLMService.ts
import { injectable } from "tsyringe";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

@injectable()
export class AgentGeminiLLMService {
  private fastModel: ChatGoogleGenerativeAI;

  constructor() {
    this.fastModel = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
      apiKey:process.env.GEMINI_API_KEY
    });
  }

  async classifyIntent(message: string) {
    const routingSchema = z.object({
      isValidWorkspaceRequest: z.boolean()
        .describe(
          "True if the user wants to generate, build, or organize a learning roadmap or folder structure.",
        ),
      targetFolder: z
        .string()
        .nullable()
        .describe(
          "The parent folder mentioned, if any (e.g., 'DevOps'). Null if none mentioned.",
        ),
      topicToLearn: z
        .string()
        .nullable()
        .describe(
          "The core subject they want to learn (e.g., 'Redis', 'React').",
        ),
    });

    const structuredModel = this.fastModel.withStructuredOutput(routingSchema, {
      name: "intent_classification",
    });

    const systemPrompt = `You are a triage router for an execution workspace assistant. 
    Analyze the incoming user message to determine if they are requesting a technical structure/roadmap generation. 
    Extract the topic and any parent folder mentioned. Reject general conversation.`;

    const result = await structuredModel.invoke([
      ["system", systemPrompt],
      ["human", message],
    ]);

    return result;
  }
}
