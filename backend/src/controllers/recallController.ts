import { Request, Response } from "express";
import { MongoRecallRepository } from "../infrastructure/recall/repositories/MongoRecallRepository";
import { MongoMessageRepository } from "../infrastructure/chat/repositories/MongoMessageRepository";
import { CreateCard } from "../application/recall/use-cases/CreateCard";
import { UpdateCard } from "../application/recall/use-cases/UpdateCard";
import { GetDueCards } from "../application/recall/use-cases/GetDueCards";
import { DeleteCard } from "../application/recall/use-cases/DeleteCard";
import { ClearAllCards } from "../application/recall/use-cases/ClearAllCards";
import { CountDueCards } from "../application/recall/use-cases/CountDueCards";

const recallRepository = new MongoRecallRepository();
const messageRepository = new MongoMessageRepository();

export const creatingCard = async (req: any, res: any) => {
    let { content, chatId, msgId = null } = req.body;
    
    if (!content && msgId) {
        const message = await messageRepository.findById(msgId);
        if (message) {
            content = message.content;
        }
    }

    const createCardUseCase = new CreateCard(recallRepository);
    const result = await createCardUseCase.execute(req.user._id.toString(), content, chatId);

    res.status(201).json({ success: true, data: result });
}

export const updatingCard = async (req: any, res: any) => {
    const cardId = req.params.id as string;
    const { rating } = req.body;
    let parsedRating = parseInt(rating);

    const updateCardUseCase = new UpdateCard(recallRepository);
    const result = await updateCardUseCase.execute(req.user._id.toString(), cardId, parsedRating);

    res.status(200).json({ success: true, data: result });
}

export const gettingDueCards = async (req: any, res: any) => {
    const getDueCardsUseCase = new GetDueCards(recallRepository);
    const dueCards = await getDueCardsUseCase.execute(req.user._id.toString());
    res.status(200).json({ success: true, data: dueCards });
}

export const deletingCard = async (req: any, res: any) => {
    const deleteCardUseCase = new DeleteCard(recallRepository);
    await deleteCardUseCase.execute(req.user._id.toString(), req.params.id);
    res.status(200).json({ success: true, message: "Card deleted" });
}

export const clearingCards = async (req: any, res: any) => {
    const clearAllCardsUseCase = new ClearAllCards(recallRepository);
    await clearAllCardsUseCase.execute(req.user._id.toString());
    res.status(200).json({ success: true, message: "All cards cleared" });
}

export const countingCards = async (req: any, res: any) => {
    const countDueCardsUseCase = new CountDueCards(recallRepository);
    const count = await countDueCardsUseCase.execute(req.user._id.toString());
    res.status(200).json({ success: true, count });
}