// infrastructure/services/GeminiLLMService.ts
import { injectable } from "tsyringe";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

@injectable()
export class AgentGeminiLLMService {
  private fastModel: ChatGoogleGenerativeAI;

  constructor() {
    this.fastModel = new ChatGoogleGenerativeAI({
      model: "gemini-3.1-flash-lite",
      temperature: 0,
      apiKey:process.env.GEMINI_API_KEY
    });
  }

  async classifyIntent(message: string, folderTree: string) {
    const routingSchema = z.object({
      isValidWorkspaceRequest: z.boolean()
        .describe(
          "True if the user wants to generate, build, or organize a learning roadmap or folder structure.",
        ),
      targetFolderId: z
        .string()
        .nullable()
        .describe(
          "The ID of the folder from the folder tree that matches the user's request. Return 'root' if they explicitly ask to create it at the root folder/directory. Return null if no target folder is mentioned, or if it is ambiguous, or if the folder does not exist in the tree.",
        ),
      targetFolder: z
        .string()
        .nullable()
        .describe(
          "The name/description of the parent folder mentioned by the user (e.g., 'DevOps', 'week 1 devops'). 'root' if requested at root. Null if none mentioned.",
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
    
    Here is the minimal hierarchical folder structure of the user's workspace:
    ${folderTree}
    
    Extract the topic and any parent folder mentioned. Reject general conversation.
    
    If the user mentions a target parent folder (e.g. "DevOps inside week 1", "week 1 devops"), search the folder structure to find a matching folder.
    - If you find a single, unambiguous match in the structure, set targetFolderId to that folder's ID.
    - If the user explicitly requested the root directory/folder, set targetFolderId to 'root' and targetFolder to 'root'.
    - If no folder is mentioned, set targetFolderId and targetFolder to null.
    - If there are multiple matches (ambiguous) or if the folder is not in the tree, set targetFolderId to null, and put the mentioned name in targetFolder.`;

    const result = await structuredModel.invoke([
      ["system", systemPrompt],
      ["human", message],
    ]);

    return result;
  }

  async generateBlueprint(topic: string) {
    const blueprintSchema = z.object({
      folders: z.array(z.object({
        name: z.string(),
        chats: z.array(z.string())
      }))
    });

    const structuredModel = this.fastModel.withStructuredOutput(blueprintSchema, {
      name: "roadmap_generator",
    });

    const systemPrompt = `You are an expert technical curriculum designer. Your goal is to create a highly structured, step-by-step learning roadmap that translates into a workspace hierarchy of folders (milestones) and chats (sub-topics).

CRITICAL SIZING RULES:
Analyze the user's request to determine the required depth of the curriculum:
1. DEFAULT SCOPE: If the user simply asks for a topic (e.g., "Learn Redis" or "DevOps roadmap"), generate exactly 3 to 5 high-level folders. Inside each folder, place 2 to 4 specific, actionable sub-topic chats.
2. DETAILED SCOPE: If the user explicitly asks for a "detailed", "elaborated", "comprehensive", or "deep dive" roadmap, expand the curriculum. Generate up to 10 high-level folders, and place up to 10 specific, actionable sub-topic chats inside each.

CONTENT GUIDELINES:
- Ensure the progression is logically ordered, moving from fundamentals to advanced concepts.
- Keep folder and chat names concise, technical, and professional.
- Do not generate filler content; every chat must represent a tangible concept or task.`;

    const result = await structuredModel.invoke([
      ["system", systemPrompt],
      ["human", `Generate a roadmap for: ${topic}`],
    ]);

    return result;
  }

  async resolveFolderAmbiguity(
    userMessage: string,
    ambiguousOptions: { id: string; path: string }[],
    folderTree: string
  ) {
    const resolveSchema = z.object({
      selectedFolderId: z
        .string()
        .nullable()
        .describe(
          "The ID of the folder from the options that matches the user's selection. Null if the user's message doesn't match any option or indicates they want it created at root.",
        ),
      goToRoot: z
        .boolean()
        .describe(
          "True if the user explicitly requested to create it at the root folder/directory (e.g. 'root', 'root folder', 'create in root'). False otherwise.",
        ),
    });

    const structuredModel = this.fastModel.withStructuredOutput(resolveSchema, {
      name: "resolve_ambiguity",
    });

    const systemPrompt = `You are a conflict resolver for a workspace folder structure.
    
    Here is the minimal hierarchical folder structure of the user's workspace:
    ${folderTree}
    
    Here are the duplicate or ambiguous folder choices available:
    ${ambiguousOptions.map(opt => `- ID: ${opt.id}, Full Path: ${opt.path}`).join("\n")}
    
    The user was asked to clarify which folder they wanted. Their response is: "${userMessage}".
    
    Analyze their response against the folder structure and the available options.
    Find the option ID that best matches their clarification.
    If they click or type the exact ID, path, or refer to a specific parent/ancestor folder hierarchy (e.g. "DevOps inside week 1" vs "DevOps in root"), return the correct ID.
    Or if user asked for some other else folder you can choose that folder ID
    If their message does not match any of the option choices, return null.`;

    const result = await structuredModel.invoke([
      ["system", systemPrompt],
      ["human", `Clarification message: ${userMessage}`],
    ]);

    return {
      selectedFolderId: result.selectedFolderId,
      goToRoot: result.goToRoot,
    };
  }
}
