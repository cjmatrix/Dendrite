import { injectable, inject } from "tsyringe";
import {
  StateGraph,
  Annotation,
  MemorySaver,
  messagesStateReducer,
} from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { AgentGeminiLLMService } from "../../../infrastructure/services/AgentGeminiLLM";
import { END, START } from "@langchain/langgraph";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import mongoose from "mongoose";

const AgentState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  classification: Annotation<any>({
    reducer: (p, n) => n,
    default: () => null,
  }),
  ambiguousFolders: Annotation<any[]>({
    reducer: (p, n) => n,
    default: () => [],
  }),
  resolvedFolderId: Annotation<string | null>({
    reducer: (p, n) => n,
    default: () => null,
  }),
  researchContext: Annotation<string>({
    reducer: (p, n) => n,
    default: () => "",
  }),
  blueprint: Annotation<any>({ reducer: (p, n) => n, default: () => null }),
  status: Annotation<string>({
    reducer: (p, n) => n,
    default: () => "scanning",
  }),
  userId: Annotation<string>({ reducer: (p, n) => n, default: () => "" }),
  agentResponse: Annotation<string>({
    reducer: (p, n) => n,
    default: () => "",
  }),
});

@injectable()
export class GenerateWorkspaceUseCase {
  private checkpointer = new MemorySaver();

  constructor(
    @inject("IFolderRepository") private folderRepo: IFolderRepository,
    @inject("IChatRepository") private chatRepo: IChatRepository,
    @inject("IMessageRepository") private messageRepo: IMessageRepository,
  ) {}

  private llm = new AgentGeminiLLMService();

  private async getMinimalFolders(userId: string): Promise<string> {
    const allFolders = await this.folderRepo.findAllByUserId(userId);
    const folderMap = new Map();

    for (const folder of allFolders) {
      folderMap.set(folder._id.toString(), {
        id: folder._id.toString(),
        name: folder.name,
        children: []
      });
    }

    const roots = [];
    for (const folder of allFolders) {
      const node = folderMap.get(folder._id.toString());
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId.toString());
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    const formatNode = (node: any, depth: number = 0): string => {
      const indent = "  ".repeat(depth);
      let res = `${indent}- ${node.name} (ID: ${node.id})\n`;
      for (const child of node.children) {
        res += formatNode(child, depth + 1);
      }
      return res;
    };

    let result = "";
    for (const root of roots) {
      result += formatNode(root, 0);
    }
    return result;
  }


  async execute(params: { chatId: string; message: string; userId: string }) {
  
    await this.messageRepo.create({
      chatId: params.chatId,
      userId: params.userId,
      role: "user",
      content: params.message,
    });

    const routerNode = async (state: typeof AgentState.State) => {
      const lastMsg = state.messages[state.messages.length - 1].content;

      if (state.status === "awaiting_clarification") {
        return {};
      }
      const folderTree = await this.getMinimalFolders(params.userId);
      const classification = await this.llm.classifyIntent(lastMsg, folderTree);
      return { classification, userId: params.userId };
    };

    const checkAmbiguityNode = async (state: typeof AgentState.State) => {
      if (!state.classification.isValidWorkspaceRequest) {
        return {
          status: "rejected",
          agentResponse: "I can only help you generate structured learning roadmaps and workspaces. Please state a learning goal."
        };
      }

      if (state.classification.targetFolderId) {
        if (state.classification.targetFolderId === "root") {
          return { status: "generating", resolvedFolderId: null };
        } else {
          return { status: "generating", resolvedFolderId: state.classification.targetFolderId };
        }
      }

      if (!state.classification.targetFolder) {
        return { status: "generating" };
      }

      const targetName = state.classification.targetFolder.toLowerCase();
      if (
        targetName === "root" ||
        targetName === "root folder" ||
        targetName === "at root" ||
        targetName === "root directory"
      ) {
        return { status: "generating", resolvedFolderId: null };
      }

      const allFolders = await this.folderRepo.findAllByUserId(state.userId);
      const folderMap = new Map<string, any>();
      for (const f of allFolders) {
        folderMap.set(f._id.toString(), f);
      }

      const buildPath = (folderId: string): string => {
        const pathParts: string[] = [];
        let currentId: string | null = folderId;
        while (currentId) {
          const folder = folderMap.get(currentId);
          if (!folder) break;
          pathParts.unshift(folder.name);
          currentId = folder.parentId ? folder.parentId.toString() : null;
        }
        return pathParts.join(" > ");
      };

      const matches = allFolders.filter((f) =>
        f.name.toLowerCase().includes(targetName),
      );

      if (matches.length > 1) {
        const msg = matches.map((m) => buildPath(m._id.toString())).join(", ");
        return {
          status: "awaiting_clarification",
          ambiguousFolders: matches.map((m) => ({
            id: m._id.toString(),
            path: buildPath(m._id.toString()),
          })),
          agentResponse: `I found multiple matching folders. Please clarify which folder you want to target: ${msg}`
        };
      } else if (matches.length === 1) {
        return {
          status: "generating",
          resolvedFolderId: matches[0]._id.toString(),
        };
      } else {
        return { status: "generating", resolvedFolderId: state.resolvedFolderId || null };
      }
    };

    const resolveNode = async (state: typeof AgentState.State) => {
      const lastMsg = state.messages[state.messages.length - 1].content.trim();
      const folderTree = await this.getMinimalFolders(state.userId);
      
      const { selectedFolderId, goToRoot } = await this.llm.resolveFolderAmbiguity(
        lastMsg,
        state.ambiguousFolders,
        folderTree
      );
      
      if (goToRoot) {
        return {
          status: "generating",
          resolvedFolderId: null,
          ambiguousFolders: [],
        };
      }

      if (selectedFolderId) {
        return {
          status: "generating",
          resolvedFolderId: selectedFolderId,
          ambiguousFolders: [],
        };
      }
      const msg = state.ambiguousFolders.map((item) => item.path).join(", ");
      return {
        status: "awaiting_clarification",
        agentResponse: `I didnt found any folder that you mentioned. Please clarify which folder you want to target: ${msg}`
      };
    };

    const blueprintNode = async (state: typeof AgentState.State) => {
      const topic = state.classification.topicToLearn;
      const blueprint = await this.llm.generateBlueprint(topic);
      return { blueprint, status: "executing" };
    };

    const executeDBNode = async (state: typeof AgentState.State) => {
      if (!state.blueprint || !state.blueprint.folders)
        return {
          status: "completed",
          agentResponse: "I have successfully generated your workspace roadmaps and milestone chats!"
        };
      console.log(JSON.stringify(state.blueprint, null, 2));

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const topic = state.classification.topicToLearn || "Workspace";
        const rootFolderName = `${topic.charAt(0).toUpperCase() + topic.slice(1)} Roadmap`;

        const rootFolder = await this.folderRepo.create({
          name: rootFolderName,
          parentId: state.resolvedFolderId || null,
          userId: state.userId,
          ownerId: state.userId,
        });

        for (const f of state.blueprint.folders) {
          const newFolder = await this.folderRepo.create({
            name: f.name,
            parentId: rootFolder._id.toString(),
            userId: state.userId,
            ownerId: state.userId,
          });

          for (const chatTitle of f.chats) {
            await this.chatRepo.create({
              title: chatTitle,
              folderId: newFolder._id,
              userId: state.userId,
              type: "normal",
              messages: [],
            });
          }
        }
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        console.error("Agent DB Transaction Error:", error);
        return {
          status: "failed",
          agentResponse: "An error occurred while programmatically building your workspace."
        };
      } finally {
        session.endSession();
      }

      return {
        status: "completed",
        agentResponse: "I have successfully generated your workspace roadmaps and milestone chats!"
      };
    };

    const workflow = new StateGraph(AgentState)
      .addNode("router", routerNode)
      .addNode("checkAmbiguity", checkAmbiguityNode)
      .addNode("resolveAmbiguity", resolveNode)
      .addNode("generateBlueprint", blueprintNode)
      .addNode("executeDB", executeDBNode)

      .addEdge(START, "router")
      .addConditionalEdges("router", (state) =>
        state.status === "awaiting_clarification"
          ? "resolveAmbiguity"
          : "checkAmbiguity",
      )
      .addConditionalEdges("checkAmbiguity", (state) => {
        if (state.status === "rejected") return END;
        if (state.status === "awaiting_clarification") return END;
        return "generateBlueprint";
      })
      .addConditionalEdges("resolveAmbiguity", (state) => {
        if (state.status === "awaiting_clarification") return END;
        return "generateBlueprint";
      })
      .addEdge("generateBlueprint", "executeDB")
      .addEdge("executeDB", END);

    const app = workflow.compile({ checkpointer: this.checkpointer });
    const config = { configurable: { thread_id: params.chatId } };

    const currentState = await app.getState(config);
    const hasPreviousState = currentState && currentState.values && currentState.values.messages && currentState.values.messages.length > 0;

    const chat = await this.chatRepo.findByIdAndUserId(params.chatId, params.userId);
    const defaultFolderId = chat && chat.folderId ? chat.folderId.toString() : null;

    const initialInput: any = {
      messages: [new HumanMessage(params.message)],
      userId: params.userId,
    };

    if (!hasPreviousState) {
      initialInput.resolvedFolderId = defaultFolderId;
    }

    await app.invoke(initialInput, config);
    const finalState = await app.getState(config);

    const modelReply = finalState.values.agentResponse;

    if (modelReply) {
      await this.messageRepo.create({
        chatId: params.chatId,
        userId: params.userId,
        role: "model",
        content: modelReply,
      });
    }

    return {
      status: finalState.values.status,
      options: finalState.values.ambiguousFolders,
      messages: modelReply,
      blueprint: finalState.values.blueprint,
    };
  }
}
