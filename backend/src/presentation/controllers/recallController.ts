import { Request, Response } from "express";
import { BaseController } from "./base/BaseController";
import { AppError } from "../../utils/AppError";
import { injectable, inject, container } from "tsyringe";
import { IMessageRepository } from "../../domain/chat/repositories/IMessageRepository";
import {
  ICreateCardUseCase,
  IUpdateCardUseCase,
  IGetDueCardsUseCase,
  IDeleteCardUseCase,
  IClearAllCardsUseCase,
  ICountDueCardsUseCase,
} from "../../application/recall/use-cases/interfaces";
import { HttpStatus } from "../constants/httpStatus";
import { RECALL_MESSAGES } from "../constants/recallMessages";

@injectable()
export class RecallController extends BaseController {
  constructor(
    @inject("ICreateCardUseCase") private createCardUseCase: ICreateCardUseCase,
    @inject("IUpdateCardUseCase") private updateCardUseCase: IUpdateCardUseCase,
    @inject("IGetDueCardsUseCase")
    private getDueCardsUseCase: IGetDueCardsUseCase,
    @inject("IDeleteCardUseCase") private deleteCardUseCase: IDeleteCardUseCase,
    @inject("IClearAllCardsUseCase")
    private clearAllCardsUseCase: IClearAllCardsUseCase,
    @inject("ICountDueCardsUseCase")
    private countDueCardsUseCase: ICountDueCardsUseCase,
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
  ) {
    super();
  }

  public createCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      let { content, chatId, msgId } = req.body;

      if (!content && msgId) {
        const message = await this.messageRepository.findById(msgId);
        if (message) {
          content = message.content;
        }
      }

      if (!content) {
        throw new AppError(RECALL_MESSAGES.CONTENT_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const result = await this.createCardUseCase.execute(
        userId,
        content,
        chatId,
      );

      this.sendSuccess(res, result, HttpStatus.CREATED, RECALL_MESSAGES.CARD_CREATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public updateCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const cardId = this.getRouteParam(req, "id");
      const { rating } = req.body;

      if (rating === undefined) {
        throw new AppError(RECALL_MESSAGES.RATING_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const parsedRating = parseInt(rating, 10);
      if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        throw new AppError(RECALL_MESSAGES.RATING_INVALID, HttpStatus.BAD_REQUEST);
      }

      const result = await this.updateCardUseCase.execute(
        userId,
        cardId,
        parsedRating,
      );

      this.sendSuccess(res, result, HttpStatus.OK, RECALL_MESSAGES.CARD_UPDATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public getDueCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const dueCards = await this.getDueCardsUseCase.execute(userId);

      this.sendSuccess(res, dueCards);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public deleteCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const cardId = this.getRouteParam(req, "id");

      await this.deleteCardUseCase.execute(userId, cardId);

      this.sendSuccess(res, null, HttpStatus.OK, RECALL_MESSAGES.CARD_DELETED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public clearAllCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      await this.clearAllCardsUseCase.execute(userId);

      this.sendSuccess(res, null, HttpStatus.OK, RECALL_MESSAGES.ALL_CLEARED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public countDueCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const count = await this.countDueCardsUseCase.execute(userId);

      this.sendSuccess(res, { count });
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const recallController = container.resolve(RecallController);
