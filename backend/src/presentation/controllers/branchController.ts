import { Request, Response } from 'express';
import { BaseController } from './base/BaseController';
import { DIContainer } from './container/DIContainer';
import { AppError } from '../../utils/AppError';




export class BranchController extends BaseController {
  constructor() {
    super();
  }

  
  public inheritContext = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');
      const { contextParentId } = req.body;

      if (!contextParentId) {
        throw new AppError('Context parent ID is required', 400);
      }

      const inheritContextUseCase = DIContainer.getInheritContextUseCase();
      const updatedChat = await inheritContextUseCase.execute(id, userId, contextParentId);

      this.sendSuccess(res, updatedChat, 200, 'Context inherited successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };


  public unlinkInheritance = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');

      const unlinkInheritanceUseCase = DIContainer.getUnlinkInheritanceUseCase();
      const updatedChat = await unlinkInheritanceUseCase.execute(id, userId);

      this.sendSuccess(res, updatedChat, 200, 'Inheritance unlinked successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };
}





export const branchController = new BranchController();


