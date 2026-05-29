import { Request, Response } from 'express';
import { BaseController } from './base/BaseController';
import { DIContainer } from './container/DIContainer';
import { AppError } from '../../utils/AppError';


export class RecallController extends BaseController {
  constructor() {
    super();
  }


  public createCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      let { content, chatId, msgId } = req.body;

     
      if (!content && msgId) {
        const messageRepository = DIContainer.getMessageRepository();
        const message = await messageRepository.findById(msgId);
        if (message) {
          content = message.content;
        }
      }

      if (!content) {
        throw new AppError('Card content is required', 400);
      }

      const createCardUseCase = DIContainer.getCreateCardUseCase();
      const result = await createCardUseCase.execute(userId, content, chatId);

      this.sendSuccess(res, result, 201, 'Card created successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

  
  public updateCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const cardId = this.getRouteParam(req, 'id');
      const { rating } = req.body;

      if (rating === undefined) {
        throw new AppError('Rating is required', 400);
      }

      const parsedRating = parseInt(rating, 10);
      if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        throw new AppError('Rating must be a number between 0 and 5', 400);
      }

      const updateCardUseCase = DIContainer.getUpdateCardUseCase();
      const result = await updateCardUseCase.execute(userId, cardId, parsedRating);

      this.sendSuccess(res, result, 200, 'Card updated successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

 
  public getDueCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const getDueCardsUseCase = DIContainer.getGetDueCardsUseCase();
      const dueCards = await getDueCardsUseCase.execute(userId);

      this.sendSuccess(res, dueCards);
    } catch (error) {
      this.sendError(res, error);
    }
  };


  public deleteCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const cardId = this.getRouteParam(req, 'id');

      const deleteCardUseCase = DIContainer.getDeleteCardUseCase();
      await deleteCardUseCase.execute(userId, cardId);

      this.sendSuccess(res, null, 200, 'Card deleted successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

 

  public clearAllCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const clearAllCardsUseCase = DIContainer.getClearAllCardsUseCase();
      await clearAllCardsUseCase.execute(userId);

      this.sendSuccess(res, null, 200, 'All cards cleared successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };



  public countDueCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const countDueCardsUseCase = DIContainer.getCountDueCardsUseCase();
      const count = await countDueCardsUseCase.execute(userId);

      this.sendSuccess(res, { count });
    } catch (error) {
      this.sendError(res, error);
    }
  };
}


export const recallController = new RecallController();