import { Router } from "express";
import { container } from "tsyringe";
import { AgentController } from "../controllers/AgentController";
import { userProtect } from "../middleware/authMiddleware";

const router = Router();
const agentController = container.resolve(AgentController);

router.post("/workspace/:id", userProtect,(req, res) => agentController.handleAgentRequest(req, res));

export default router;