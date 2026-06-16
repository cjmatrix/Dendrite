import { injectable, inject } from "tsyringe";
import { Request, Response } from "express";
import { GenerateWorkspaceUseCase } from "../../application/agent/use-cases/GenerateWorkspaceUseCase";
// import { GenerateWorkspaceUseCase } from "../../application/use-cases/GenerateWorkspaceUseCase";

@injectable()
export class AgentController {
  constructor(
    // @inject("GenerateWorkspaceUseCase") private agentUseCase: GenerateWorkspaceUseCase
    private agentUseCase=new GenerateWorkspaceUseCase()
  ) {}

  async handleAgentRequest(req: Request, res: Response) {
    try {
      const {message, userId } = req.body;
      const chatId=req.params.id as string

      const result = await this.agentUseCase.execute({ chatId, message, userId });

  
      if (result.status === "rejected") {
        return res.status(200).json({ type: "rejection", message: result.message });
      }

      if (result.status === "awaiting_clarification") {
        return res.status(200).json({ 
          type: "clarification_needed", 
        //   options: result.options,
          message: "I found multiple matching folders. Which one should I use?" 
        });
      }

      return res.status(200).json({
        type: "success",
        message: "Workspace successfully generated!",
        // blueprint: result.blueprint
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Agent execution failed." });
    }
  }
}