import { injectable, inject } from "tsyringe";
import { StateGraph, Annotation, MemorySaver, messagesStateReducer } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AgentGeminiLLMService } from "../../../infrastructure/services/AgentGeminiLLM";
import { END,START } from "@langchain/langgraph";
// import { IWorkspaceRepository } from "../interfaces/IWorkspaceRepository";
// import { ILLMService } from "../interfaces/ILLMService";
// import { ISearchService } from "../interfaces/ISearchService";

// 1. Define the Graph State Schema
const AgentState = Annotation.Root({
  messages: Annotation<any[]>({ reducer: messagesStateReducer, default: () => [] }),
  isValidRequest: Annotation<boolean>({ reducer: (p, n) => n, default: () => true }),
  ambiguousFolders: Annotation<any[]>({ reducer: (p, n) => n, default: () => [] }),
  resolvedFolderId: Annotation<string | null>({ reducer: (p, n) => n, default: () => null }),
  researchContext: Annotation<string>({ reducer: (p, n) => n, default: () => "" }),
  blueprint: Annotation<any>({ reducer: (p, n) => n, default: () => null }),
});

@injectable()
export class GenerateWorkspaceUseCase {
  private checkpointer = new MemorySaver(); 

  constructor(
    // @inject("WorkspaceRepository") private workspaceRepo: IWorkspaceRepository,
    // @inject("LLMService") private llm: ILLMService,
    private llm=new AgentGeminiLLMService()
    // @inject("SearchService") private searchApi: ISearchService 
  ) {}

  async execute(params: { chatId: string; message: string; userId: string }) {
    


    const routerNode = async (state: typeof AgentState.State) => {
      const lastMsg = state.messages[state.messages.length - 1].content;
      const isWorkspaceIntent = await this.llm.classifyIntent(lastMsg); 
      return { isValidRequest: isWorkspaceIntent };
    };


    const workflow=new StateGraph(AgentState)
    .addNode("router",routerNode)
    .addEdge(START,"router")
    .addEdge("router",END)

     const app = workflow.compile({ checkpointer: this.checkpointer });

     const config = { configurable: { thread_id: params.chatId } };


    await app.invoke({ messages: [new HumanMessage(params.message)] }, config);
    const finalState = await app.getState(config);
    console.log(finalState,"Hereeeeeeeee")

    return {status:"sucess",message:"pass"}
    
  }
 
  
}