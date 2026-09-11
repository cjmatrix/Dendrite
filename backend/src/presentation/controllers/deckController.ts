import { Request, Response } from "express";
import { BaseController } from "./base/BaseController";
import { injectable, inject, container } from "tsyringe";
import {
  ICreateDeckUseCase,
  IGetDecksUseCase,
  IUpdateDeckUseCase,
  IDeleteDeckUseCase,
  IMoveCardToDeckUseCase,
  IMoveCardsToDeckUseCase,
  IGetDeckStatsUseCase,
} from "../../application/deck/use-cases/interfaces";
import { HttpStatus } from "../constants/httpStatus";
import { DECK_MESSAGES } from "../constants/deckMessages";

@injectable()
export class DeckController extends BaseController {
  constructor(
    @inject("ICreateDeckUseCase") private createDeckUseCase: ICreateDeckUseCase,
    @inject("IGetDecksUseCase") private getDecksUseCase: IGetDecksUseCase,
    @inject("IGetDeckStatsUseCase") private getDeckStatsUseCase: IGetDeckStatsUseCase,
    @inject("IUpdateDeckUseCase") private updateDeckUseCase: IUpdateDeckUseCase,
    @inject("IDeleteDeckUseCase") private deleteDeckUseCase: IDeleteDeckUseCase,
    @inject("IMoveCardToDeckUseCase") private moveCardToDeckUseCase: IMoveCardToDeckUseCase,
    @inject("IMoveCardsToDeckUseCase") private moveCardsToDeckUseCase: IMoveCardsToDeckUseCase,
  ) {
    super();
  }

  public createDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { name, color } = req.body;

      const result = await this.createDeckUseCase.execute(userId, name, color);

      this.sendSuccess(res, result, HttpStatus.CREATED, DECK_MESSAGES.DECK_CREATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public getDecks = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const decks = await this.getDecksUseCase.execute(userId);

      this.sendSuccess(res, decks);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public getDeckStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const stats = await this.getDeckStatsUseCase.execute(userId);

      this.sendSuccess(res, stats);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public updateDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const deckId = this.getRouteParam(req, "id");
      const { name, color } = req.body;

      const result = await this.updateDeckUseCase.execute(userId, deckId, { name, color });

      this.sendSuccess(res, result, HttpStatus.OK, DECK_MESSAGES.DECK_UPDATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public deleteDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const deckId = this.getRouteParam(req, "id");

      await this.deleteDeckUseCase.execute(userId, deckId);

      this.sendSuccess(res, null, HttpStatus.OK, DECK_MESSAGES.DECK_DELETED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public moveCardToDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { cardId, deckId } = req.body;

      const result = await this.moveCardToDeckUseCase.execute(userId, cardId, deckId);

      this.sendSuccess(res, result, HttpStatus.OK, DECK_MESSAGES.CARD_MOVED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public moveCardsToDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { fromDeckId, toDeckId } = req.body;

      const result = await this.moveCardsToDeckUseCase.execute(userId, fromDeckId, toDeckId);

      this.sendSuccess(res, result, HttpStatus.OK, DECK_MESSAGES.CARDS_MOVED);
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const deckController = container.resolve(DeckController);
