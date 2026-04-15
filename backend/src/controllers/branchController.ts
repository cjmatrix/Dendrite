import { Request, Response } from 'express';
import { BaseController } from './base/BaseController';
import { DIContainer } from './container/DIContainer';
import { AppError } from '../utils/AppError';

/**
 * BranchController - handles branch context management for chats
 * Uses clean architecture with dependency injection
 */
export class BranchController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Inherit context from a parent chat branch
   * POST /api/branch/inherit/:id
   */
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
}

// Export singleton instance for use in routes
export const branchController = new BranchController();


