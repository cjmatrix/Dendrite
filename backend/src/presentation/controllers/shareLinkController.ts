import { Request, Response } from "express";
import { BaseController } from "./base/BaseController";
import { AppError } from "../../utils/AppError";
import { injectable, inject, container } from "tsyringe";
import { CreateLink } from "../../application/shareLink/use-cases/createLink";
import { ResolveLink } from "../../application/shareLink/use-cases/resolveLink";

@injectable()
export class ShareLinkController extends BaseController {
  constructor(
    @inject("ICreateLinkUseCase") private createLinkUseCase: CreateLink,
    @inject("IResolveLinkUseCase") private resolveLinkUseCase: ResolveLink
  ) {
    super();
  }

  public createLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const creatorId = this.validateUserAuth(req);
      const { targetId, targetType, behaviorSharingPolicy } = req.body;

      if (!targetId || typeof targetId !== "string") {
        throw new AppError("targetId is required and must be a string", 400);
      }

      if (targetType !== "chat" && targetType !== "folder") {
        throw new AppError("targetType must be either 'chat' or 'folder'", 400);
      }

      const data = await this.createLinkUseCase.execute({
        creatorId,
        targetId,
        targetType,
        behaviorSharingPolicy,
      });

      this.sendSuccess(res, data, 201, "Shared link created successfully");
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public resolveLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      const { chatId } = req.query;

      if (!token || typeof token !== "string") {
        throw new AppError("token is required", 400);
      }

      const data = await this.resolveLinkUseCase.execute(token, chatId as string);

      this.sendSuccess(res, data, 200, "Shared link resolved successfully");
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const shareLinkController = container.resolve(ShareLinkController);
