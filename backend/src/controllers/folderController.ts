import { Request, Response } from 'express';
import { BaseController } from './base/BaseController';
import { DIContainer } from './container/DIContainer';
import { AppError } from '../utils/AppError';


export class FolderController extends BaseController {
  constructor() {
    super();
  }

 
  public createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { name, parentId } = req.body;

      if (!name || typeof name !== 'string') {
        throw new AppError('Folder name is required and must be a string', 400);
      }

      const createFolderUseCase = DIContainer.getCreateFolderUseCase();
      const data = await createFolderUseCase.execute(userId, name, parentId);

      this.sendSuccess(res, data, 201, 'Folder created successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

 
  public getFolders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const getFoldersUseCase = DIContainer.getGetFoldersUseCase();
      const data = await getFoldersUseCase.execute(userId);

      this.sendSuccess(res, data, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  
  public updateFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');
      const { name, isExpanded } = req.body;

      if (!name && isExpanded === undefined) {
        throw new AppError('At least one field (name or isExpanded) is required', 400);
      }

      const updateFolderUseCase = DIContainer.getUpdateFolderUseCase();
      const data = await updateFolderUseCase.execute(id, userId, { name, isExpanded });

      this.sendSuccess(res, data, 200, 'Folder updated successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

  
  public deleteFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');

      const deleteFolderUseCase = DIContainer.getDeleteFolderUseCase();
      const data = await deleteFolderUseCase.execute(id, userId);

      this.sendSuccess(res, data, 200, 'Folder deleted successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };
}


export const folderController = new FolderController();