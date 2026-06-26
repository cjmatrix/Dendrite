import { Request, Response } from 'express';
import { BaseController } from './base/BaseController';
import { AppError } from '../../utils/AppError';
import { injectable, inject, container } from 'tsyringe';
import {
  ICreateFolderUseCase,
  IGetFoldersUseCase,
  IUpdateFolderUseCase,
  IDeleteFolderUseCase,
  IUpdateFolderBehaviorUseCase,
  IGetbehaviorUseCase
} from '../../application/folder/use-cases/interfaces';
import { SearchExplorerUseCase } from '../../application/folder/use-cases/SearchExplorerUseCase';
import { HttpStatus } from '../constants/httpStatus';
import { FOLDER_MESSAGES } from '../constants/folderMessages';

@injectable()
export class FolderController extends BaseController {
  constructor(
    @inject("ICreateFolderUseCase") private createFolderUseCase: ICreateFolderUseCase,
    @inject("IGetFoldersUseCase") private getFoldersUseCase: IGetFoldersUseCase,
    @inject("IUpdateFolderUseCase") private updateFolderUseCase: IUpdateFolderUseCase,
    @inject("IDeleteFolderUseCase") private deleteFolderUseCase: IDeleteFolderUseCase,
    @inject("IUpdateFolderBehaviorUseCase") private updateFolderBehaviorUseCase: IUpdateFolderBehaviorUseCase,
    @inject("IGetbehaviorUseCase") private getBehavior: IGetbehaviorUseCase,
    @inject("SearchExplorerUseCase") private searchExplorerUseCase: SearchExplorerUseCase
  ) {
    super();
  }


  public getBehaviorOfFolder=async(req:Request,res:Response)=>{

    const userId=this.validateUserAuth(req);

    const folderId=req.params.id as string

    const data=await this.getBehavior.execute(folderId,userId)
    this.sendSuccess(res,data,HttpStatus.OK,FOLDER_MESSAGES.FOLDER_BEHAVIOR);

  }


  public createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { name, parentId } = req.body;

      if (!name || typeof name !== 'string') {
        throw new AppError(FOLDER_MESSAGES.NAME_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const data = await this.createFolderUseCase.execute(userId, name, parentId);

      this.sendSuccess(res, data, HttpStatus.CREATED, FOLDER_MESSAGES.FOLDER_CREATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public getFolders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const data = await this.getFoldersUseCase.execute(userId);

      this.sendSuccess(res, data, HttpStatus.OK);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public updateFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');
      const { name, isExpanded, parentId } = req.body;

      if (name === undefined && isExpanded === undefined && parentId === undefined) {
        throw new AppError(FOLDER_MESSAGES.FIELDS_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const data = await this.updateFolderUseCase.execute(id, userId, { name, isExpanded, parentId });

      this.sendSuccess(res, data, HttpStatus.OK, FOLDER_MESSAGES.FOLDER_UPDATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public updateBehavior = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');
      const { content } = req.body;

      if (content === undefined || typeof content !== 'string') {
        throw new AppError(FOLDER_MESSAGES.CONTENT_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const data = await this.updateFolderBehaviorUseCase.execute(id, userId, content);

      this.sendSuccess(res, data, HttpStatus.OK, FOLDER_MESSAGES.BEHAVIOR_UPDATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public deleteFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');

      const data = await this.deleteFolderUseCase.execute(id, userId);

      this.sendSuccess(res, data, HttpStatus.OK, FOLDER_MESSAGES.FOLDER_DELETED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public searchItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const query = req.query.q as string || '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const type = (req.query.type as any) || 'all';
      const folderId = req.query.folderId as string | undefined;

      const results = await this.searchExplorerUseCase.execute({
        userId,
        query,
        type,
        folderId,
      });

      this.sendSuccess(res, results, HttpStatus.OK, FOLDER_MESSAGES.SEARCH_SUCCESSFUL);
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const folderController = container.resolve(FolderController);