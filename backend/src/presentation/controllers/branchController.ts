import { Request, Response } from 'express';
import { BaseController } from './base/BaseController';
import { injectable, inject, container } from 'tsyringe';
import { IInheritContextUseCase, IUnlinkInheritanceUseCase } from '../../application/branch/use-cases/interfaces';
import { HttpStatus } from '../constants/httpStatus';
import { CHAT_MESSAGES } from '../constants/chatMessages';

@injectable()
export class BranchController extends BaseController {
  constructor(
    @inject("IInheritContextUseCase") private inheritContextUseCase: IInheritContextUseCase,
    @inject("IUnlinkInheritanceUseCase") private unlinkInheritanceUseCase: IUnlinkInheritanceUseCase
  ) {
    super();
  }

  public inheritContext = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');
      const { contextParentId } = req.body;

      const updatedChat = await this.inheritContextUseCase.execute(id, userId, contextParentId);

      this.sendSuccess(res, updatedChat, HttpStatus.OK, CHAT_MESSAGES.CONTEXT_INHERITED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public unlinkInheritance = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');

      const updatedChat = await this.unlinkInheritanceUseCase.execute(id, userId);

      this.sendSuccess(res, updatedChat, HttpStatus.OK, CHAT_MESSAGES.INHERITANCE_UNLINKED);
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const branchController = container.resolve(BranchController);
