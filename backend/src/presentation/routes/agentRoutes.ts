import { Router } from "express";
import { container } from "tsyringe";
import { AgentController } from "../controllers/AgentController";
import { userProtect } from "../middleware/authMiddleware";
import { rateLimit } from "../middleware/rateLimitMiddleware";
import { validateBody } from "../middleware/validateRequest";
import { AgentWorkspaceBodySchema } from "../../application/agent/dtos/agent.dto";

const router = Router();
const agentController = container.resolve(AgentController);

router.post("/workspace/:id", userProtect, validateBody(AgentWorkspaceBodySchema), rateLimit("agentWorkspaces"), (req, res) => agentController.handleAgentRequest(req, res));

export default router;