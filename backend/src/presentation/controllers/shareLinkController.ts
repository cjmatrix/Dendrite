import { Request, Response } from "express";
import { BaseController } from "./base/BaseController";
import { AppError } from "../../utils/AppError";
import { injectable, inject, container } from "tsyringe";
import { CreateLink } from "../../application/shareLink/use-cases/createLink";
import { ResolveLink } from "../../application/shareLink/use-cases/resolveLink";
import { DownloadSharedLink } from "../../application/shareLink/use-cases/downloadSharedLink";
import { HttpStatus } from "../constants/httpStatus";
import { SHARE_MESSAGES } from "../constants/shareMessages";

@injectable()
export class ShareLinkController extends BaseController {
  constructor(
    @inject("ICreateLinkUseCase") private createLinkUseCase: CreateLink,
    @inject("IResolveLinkUseCase") private resolveLinkUseCase: ResolveLink,
    @inject("IDownloadSharedLinkUseCase") private downloadSharedLinkUseCase: DownloadSharedLink
  ) {
    super();
  }

  public createLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const creatorId = this.validateUserAuth(req);
      const { targetId, targetType, behaviorSharingPolicy } = req.body;

      if (!targetId || typeof targetId !== "string") {
        throw new AppError(SHARE_MESSAGES.TARGET_ID_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      if (targetType !== "chat" && targetType !== "folder") {
        throw new AppError(SHARE_MESSAGES.TARGET_TYPE_INVALID, HttpStatus.BAD_REQUEST);
      }

      const data = await this.createLinkUseCase.execute({
        userId:req.user._id,
        creatorId,
        targetId,
        targetType,
        behaviorSharingPolicy,
      });

      this.sendSuccess(res, data, HttpStatus.CREATED, SHARE_MESSAGES.LINK_CREATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public resolveLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      const { chatId } = req.query;

      if (!token || typeof token !== "string") {
        throw new AppError(SHARE_MESSAGES.TOKEN_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const data = await this.resolveLinkUseCase.execute(token, chatId as string);

      this.sendSuccess(res, data, HttpStatus.OK, SHARE_MESSAGES.LINK_RESOLVED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public downloadLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { token } = req.params;
      const { destinationFolderId } = req.body;

      if (!token || typeof token !== "string") {
        throw new AppError(SHARE_MESSAGES.TOKEN_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const result = await this.downloadSharedLinkUseCase.execute({
        token,
        userId,
        destinationFolderId: destinationFolderId || null
      });

      this.sendSuccess(res, result, HttpStatus.OK, SHARE_MESSAGES.CONTENTS_IMPORTED);
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const shareLinkController = container.resolve(ShareLinkController);
