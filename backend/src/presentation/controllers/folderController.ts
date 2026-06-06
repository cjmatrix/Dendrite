import { Request, Response } from 'express';
import { BaseController } from './base/BaseController';
import { AppError } from '../../utils/AppError';
import { injectable, inject, container } from 'tsyringe';
import { CreateFolder } from '../../application/folder/use-cases/CreateFolder';
import { GetFolders } from '../../application/folder/use-cases/GetFolders';
import { UpdateFolder } from '../../application/folder/use-cases/UpdateFolder';
import { DeleteFolder } from '../../application/folder/use-cases/DeleteFolder';
import { UpdateFolderBehavior } from '../../application/folder/use-cases/UpdateFolderBehavior';
import { Getbehavior } from '../../application/folder/use-cases/getBehaviour';

@injectable()
export class FolderController extends BaseController {
  constructor(
    @inject(CreateFolder) private createFolderUseCase: CreateFolder,
    @inject(GetFolders) private getFoldersUseCase: GetFolders,
    @inject(UpdateFolder) private updateFolderUseCase: UpdateFolder,
    @inject(DeleteFolder) private deleteFolderUseCase: DeleteFolder,
    @inject(UpdateFolderBehavior) private updateFolderBehaviorUseCase: UpdateFolderBehavior,
    @inject(Getbehavior) private getBehavior:Getbehavior
  ) {
    super();
  }


  public getBehaviorOfFolder=async(req:Request,res:Response)=>{

    const userId=this.validateUserAuth(req);

    const folderId=req.params.id as string

    const data=await this.getBehavior.execute(folderId,userId)
    this.sendSuccess(res,data,200,"Folder behavior");

  }


  public createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { name, parentId } = req.body;

      if (!name || typeof name !== 'string') {
        throw new AppError('Folder name is required and must be a string', 400);
      }

      const data = await this.createFolderUseCase.execute(userId, name, parentId);

      this.sendSuccess(res, data, 201, 'Folder created successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public getFolders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);

      const data = await this.getFoldersUseCase.execute(userId);

      this.sendSuccess(res, data, 200);
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
        throw new AppError('At least one field (name, isExpanded or parentId) is required', 400);
      }

      const data = await this.updateFolderUseCase.execute(id, userId, { name, isExpanded, parentId });

      this.sendSuccess(res, data, 200, 'Folder updated successfully');
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
        throw new AppError('content is required and must be a string', 400);
      }

      const data = await this.updateFolderBehaviorUseCase.execute(id, userId, content);

      this.sendSuccess(res, data, 200, 'Folder behavior updated successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public deleteFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const id = this.getRouteParam(req, 'id');

      const data = await this.deleteFolderUseCase.execute(id, userId);

      this.sendSuccess(res, data, 200, 'Folder deleted successfully');
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const folderController = container.resolve(FolderController);