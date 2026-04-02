import express from "express";
import { inheritContext } from "../controllers/branchController";
import { userProtect } from "../middleware/authMiddleware";

const router = express.Router();

router.patch("/inherit/:id", userProtect, inheritContext);

export default router;
    