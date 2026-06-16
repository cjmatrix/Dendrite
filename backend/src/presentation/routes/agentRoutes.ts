import { Router } from "express";
import { container } from "tsyringe";
import { AgentController } from "../controllers/AgentController";

const router = Router();
// const agentController = container.resolve(AgentController);
const agentController=new AgentController();


router.post("/workspace/:id", (req, res) => agentController.handleAgentRequest(req, res));

export default router;