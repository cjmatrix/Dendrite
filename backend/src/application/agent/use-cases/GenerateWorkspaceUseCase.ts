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

    const getSlidingWindowContext = (messages: any[]): string => {
      const windowMessages = messages.slice(-10);
      return windowMessages
        .map((m) => {
          let role = "User";
          if (m._getType) {
            role = m._getType() === "human" ? "User" : "Agent";
          } else if (m.role) {
            role = m.role === "user" ? "User" : "Agent";
          } else if (m.constructor && m.constructor.name === "AIMessage") {
            role = "Agent";
          }
          return `${role}: ${m.content}`;
        })
        .join("\n");
    };

    const routerNode = async (state: typeof AgentState.State) => {
      const slidingWindowMsg = getSlidingWindowContext(state.messages);
      console.log(slidingWindowMsg)
      if (state.status === "awaiting_clarification") {
        return {};
      }
      const folderTree = await this.getMinimalFolders(params.userId);
      const classification = await this.llm.classifyIntent(slidingWindowMsg, folderTree,params.message);
    
      return { agentResponse:classification.agentReponse,classification, userId: params.userId };
    };

    const checkAmbiguityNode = async (state: typeof AgentState.State) => {
        console.log(JSON.stringify(state,null,2))
      if (!state.classification.isValidWorkspaceRequest) {
        return {
          status: "rejected",
          agentResponse: state.agentResponse||"I can only help you generate structured learning roadmaps and workspaces. Please state a learning goal."
        };
      }

        if (state.classification.targetFolderId) {
        if (state.classification.targetFolderId === "root") {
          return { status: "generating", resolvedFolderId: null };
        } else {
          return { status: "generating", resolvedFolderId: state.classification.targetFolderId };
        }
      }


      if (state.classification.targetFolder) {
        const targetName = state.classification.targetFolder.toLowerCase();
        if (
          targetName === "root" ||
          targetName === "root folder" ||
          targetName === "at root" ||
          targetName === "root directory"
        ) {
          return { status: "generating", resolvedFolderId: null };
        }

        return {
            status: "awaiting_clarification",
            agentResponse: state.agentResponse || `I found multiple matching folders. Please clarify which folder you want to target`
          };

      }


      return { status: "generating", resolvedFolderId: state.resolvedFolderId || null };
    };

    const resolveNode = async (state: typeof AgentState.State) => {
      const slidingWindowMsg = getSlidingWindowContext(state.messages);
      const folderTree = await this.getMinimalFolders(state.userId);
      
      const { selectedFolderId, goToRoot } = await this.llm.resolveFolderAmbiguity(
        slidingWindowMsg,
        params.message,
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
      return {
        status: "awaiting_clarification",
        agentResponse: "I could not resolve which folder you meant. Please choose one of the options or root."
      };
    };

    const blueprintNode = async (state: typeof AgentState.State) => {
      const topic = state.classification.topicToLearn;
      const conversationHistory = getSlidingWindowContext(state.messages);
      const folderTree = await this.getMinimalFolders(state.userId);
      const blueprint = await this.llm.generateBlueprint(topic, conversationHistory, folderTree, params.message);
   
      return { agentResponse:blueprint.agentResponse,blueprint, status: "executing" };
    };

    const executeDBNode = async (state: typeof AgentState.State) => {
      
      if (!state.blueprint || !state.blueprint.folders)
        return {
          status: "completed",
          agentResponse: state.agentResponse||"I have successfully generated your workspace roadmaps and milestone chats!"
        };
      // console.log(JSON.stringify(state.blueprint, null, 2));

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const topic = state.classification.topicToLearn || "Workspace";
        const baseName = `${topic.charAt(0).toUpperCase() + topic.slice(1)} Roadmap`;

        const existingFolders = await this.folderRepo.findByPrefix(
          state.userId,
          state.resolvedFolderId,
          baseName
        );

        let rootFolderName = baseName;
        if (existingFolders.length > 0) {
          const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const suffixRegex = new RegExp(`^${escapedBaseName}(?: (\\d+))?$`);

          const maxSuffix = existingFolders.reduce((max, folder) => {
            const match = folder.name.match(suffixRegex);
            const num = match ? (match[1] ? Number(match[1]) : 0) : -1;
            return Math.max(max, num);
          }, -1);

          if (maxSuffix >= 0) {
            rootFolderName = `${baseName} ${maxSuffix + 1}`;
          }
        }
        const rootFolder = await this.folderRepo.create({
          name: rootFolderName,
          parentId: state.resolvedFolderId || null,
          userId: state.userId,
          ownerId: state.userId,
          behavior: {
            current: {
              content: state.blueprint?.rootBehavior || `This workspace contains the learning roadmap for ${topic}.`,
              updatedAt: new Date()
            },
            history: [],
            settings: {
              sharingPolicy: 'READ_WRITE'
            }
          }
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
        agentResponse: state.agentResponse||"I have successfully generated your workspace roadmaps and milestone chats!"
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
    const defaultFolderId = currentState.values.resolvedFolderId|| null;

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
