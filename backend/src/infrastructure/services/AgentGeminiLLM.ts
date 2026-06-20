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
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async classifyIntent(message: string, folderTree: string,latestMessage:string) {
    const routingSchema = z.object({
      isValidWorkspaceRequest: z
        .boolean()
        .describe(
          "True if the user wants to generate, build, or organize a learning roadmap or folder structure.",
        ),
      targetFolderId: z
        .string()
        .nullable()
        .describe(
          "The ID of the folder from the folder tree. CRITICAL: If there are multiple folders in the folder tree that match the target folder name, you MUST check if the user specified enough unique parent context in their query to distinguish between them. If they did not (e.g. they just said 'React' but there are two 'React' folders), you MUST return null so that the backend can ask for clarification. Only return a folder ID if it is 100% unique or they specified clear parent context. Return 'root' if they explicitly ask to create it at the root folder/directory.",
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
      agentReponse: z
        .string()
        .describe(
          "The assistant's conversational response back to the user. This must be formulated by you. If the request is invalid or unrelated, explain what you can do. If you detect ambiguity (e.g., there are multiple folders with the same name in the folderTree and the user did not specify parent context), write a natural, polite clarifying question listing the full paths of the matching folders and asking the user to clarify which one they mean. Otherwise, briefly describe what you are about to do.",
        ),
    });

    const structuredModel = this.fastModel.withStructuredOutput(routingSchema, {
      name: "intent_classification",
    });

    const systemPrompt = `You are a triage router for an execution workspace assistant. 
    Analyze the incoming conversation history to determine if they are requesting a technical structure/roadmap generation. 
    
    Here is the minimal hierarchical folder structure of the user's workspace:
    ${folderTree} 
    
    Extract the topic and any parent folder mentioned in their latest query, using previous messages for context if needed. Reject general conversation.
    
    If the user mentions a target parent folder:
    1. Scan the entire folder tree to check how many folders match the requested name.
    2. If there are multiple folders with the same name (e.g. two folders named "React" or "Dev"):
       - Check if the user's query specifies which one they want by mentioning parent folders (e.g. "React under week 1" vs "React under other").
       - If they did specify the parent context uniquely, set targetFolderId to that specific folder's ID, and targetFolder to the folder name.
       - If they did NOT specify the parent context (e.g. they just said "React folder" but there are two "React" folders), you MUST:
         a) Set targetFolderId to null, and set targetFolder to the folder name.
         b) Formulate a polite, natural clarifying question in the agentReponse field, listing the full paths of the matching options and asking the user which one they intended to use.
    3. If there is only a single, unique folder in the tree with that name, set targetFolderId to its ID, and targetFolder to the folder name.
    4. If the user explicitly requested the root directory/folder, set targetFolderId to 'root' and targetFolder to 'root'.
    5. If no folder is mentioned, set targetFolderId and targetFolder to null.`;

    const result = await structuredModel.invoke([
      ["system", systemPrompt],
      [
        "human",
        `User's CURRENT request:
${latestMessage}

Previous conversation context:
${message}`,
      ],
    ]);

    return result;
  }

  async generateBlueprint(
    topic: string,
    conversationHistory: string,
    folderTree: string,
    latestMessage: string,
  ) {
    const blueprintSchema = z.object({
      rootBehavior: z
        .string()
        .describe(
          "A custom, concise behavior directive explaining how the AI must behave, format, and answer questions for this topic roadmap. It MUST include the topic name and explicitly customize the tone/depth based on the user's preferences in the conversation history (e.g., if they are a beginner, expert, or asked for a specific explanation style). Must be under 100 tokens.",
        ),
      folders: z.array(
        z.object({
          name: z.string(),
          chats: z.array(z.string()),
        }),
      ),
      agentResponse: z
        .string()
        .describe(
          "A natural language response informing the user that the roadmap was created and where it was placed.",
        ),
    });

    const structuredModel = this.fastModel.withStructuredOutput(
      blueprintSchema,
      {
        name: "roadmap_generator",
      },
    );

    const systemPrompt = `You are an expert technical curriculum designer. Your goal is to create a highly structured, step-by-step learning roadmap that translates into a workspace hierarchy of folders (milestones) and chats (sub-topics).

CRITICAL SIZING RULES:
Analyze the conversation history to determine the required depth of the curriculum:
1. DEFAULT SCOPE: If the user simply asks for a topic (e.g., "Learn Redis" or "DevOps roadmap"), generate exactly 3 to 5 high-level folders. Inside each folder, place 2 to 4 specific, actionable sub-topic chats.
2. DETAILED SCOPE: If the user explicitly asks for a "detailed", "elaborated", "comprehensive", or "deep dive" roadmap, expand the curriculum. Generate up to 10 high-level folders, and place up to 10 specific, actionable sub-topic chats inside each.

CONTENT GUIDELINES:
- Ensure the progression is logically ordered, moving from fundamentals to advanced concepts.
- Keep folder and chat names concise, technical, and professional.
- Do not generate filler content; every chat must represent a tangible concept or task.
- Generate a highly tailored, custom "behavior directive" (maximum 100 tokens) that explains how the AI assistant must act, what rules/constraints it must follow, and how it should format answers when responding to questions in this specific learning workspace. Store this in the rootBehavior field.
- You MUST analyze the conversation history to customize this directive. For instance, if the user mentions they are a beginner, customize the persona to be extremely supportive, focus on basics, and avoid deep jargon. If they say they are an expert, direct the AI to skip fundamentals and provide highly advanced/optimized examples. If they ask for explanations 'like I am 5 years old', the directive must enforce using simple analogies.
- You MUST explicitly include the topic name in the behavior directive.

Workspace Folder Tree:
${folderTree}`;

    const result = await structuredModel.invoke([
      ["system", systemPrompt],
      [
        "human",
        `Topic: ${topic}

User's CURRENT request:
${latestMessage}

Previous conversation context:
${conversationHistory}`,
      ],
    ]);

    return result;
  }

  async resolveFolderAmbiguity(
    userMessage: string,
    latestMessage: string,
    ambiguousOptions: { id: string; path: string }[],
    folderTree: string,
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
    ${ambiguousOptions.map((opt) => `- ID: ${opt.id}, Full Path: ${opt.path}`).join("\n")}
    
    Analyze the user's current response (with previous context if needed) against the folder structure and the available options.
    Find the option ID that best matches their clarification.
    If they click or type the exact ID, path, or refer to a specific parent/ancestor folder hierarchy (e.g. "DevOps inside week 1" vs "DevOps in root"), return the correct ID.
    Or if user asked for some other else folder you can choose that folder ID
    If their message does not match any of the option choices, return null.`;

    const result = await structuredModel.invoke([
      ["system", systemPrompt],
      [
        "human",
        `User's CURRENT response:
${latestMessage}

Previous conversation context:
${userMessage}`,
      ],
    ]);

    return {
      selectedFolderId: result.selectedFolderId,
      goToRoot: result.goToRoot,
    };
  }
}
