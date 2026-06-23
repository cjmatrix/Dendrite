import { injectable, inject } from "tsyringe";
import { Request, Response } from "express";
import { GenerateWorkspaceUseCase } from "../../application/agent/use-cases/GenerateWorkspaceUseCase";

@injectable()
export class AgentController {
  constructor(
    @inject("GenerateWorkspaceUseCase")
    private agentUseCase: GenerateWorkspaceUseCase,
  ) {}

  async handleAgentRequest(req: Request, res: Response) {
    try {
      const { message } = req.body;
      const chatId = req.params.id as string;

      const result = await this.agentUseCase.execute({
        chatId,
        message,
        userId: req.user._id,
      });

      if (result.status === "rejected") {
        return res
          .status(200)
          .json({ type: "rejection", message: result.messages });
      }

      if (result.status === "awaiting_clarification") {
        return res.status(200).json({
          type: "clarification_needed",
          message: result.messages,
        });
      }

      return res.status(200).json({
        type: "success",
        message: "Workspace successfully generated!",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Agent execution failed." });
    }
  }
}
