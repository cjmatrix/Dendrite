import { injectable, inject } from "tsyringe";
import { Request, Response } from "express";
import { GenerateWorkspaceUseCase } from "../../application/agent/use-cases/GenerateWorkspaceUseCase";
import { HttpStatus } from "../constants/httpStatus";
import { AGENT_MESSAGES } from "../constants/agentMessages";

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
          .status(HttpStatus.OK)
          .json({ type: "rejection", message: result.messages });
      }

      if (result.status === "awaiting_clarification") {
        return res.status(HttpStatus.OK).json({
          type: "clarification_needed",
          message: result.messages,
        });
      }

      return res.status(HttpStatus.OK).json({
        type: "success",
        message: AGENT_MESSAGES.WORKSPACE_GENERATED,
      });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: errorMessage });
    }
  }
}
