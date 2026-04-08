import { Request, Response } from "express";
import { MongoChatRepository } from "../infrastructure/chat/repositories/MongoChatRepository";
import { InheritContext } from "../application/branch/use-cases/InheritContext";
import { AppError } from "../utils/AppError";

const chatRepository = new MongoChatRepository();

export const inheritContext = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { contextParentId } = req.body;

  if (!req.user || !req.user._id) {
    throw new AppError("Unauthorized", 401);
  }

  const inheritContextUseCase = new InheritContext(chatRepository);
  const updatedChat = await inheritContextUseCase.execute(id, req.user._id.toString(), contextParentId);

  res.status(200).json({ success: true, data: updatedChat });
};


