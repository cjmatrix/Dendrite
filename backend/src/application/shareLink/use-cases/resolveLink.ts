import { inject, injectable } from "tsyringe";
import { ISharedLinkRepository } from "../../../domain/shareLink/repositories/ISharedLinkRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { AppError } from "../../../utils/AppError";

@injectable()
export class ResolveLink {
  constructor(
    @inject("ISharedLinkRepository") private shareLinkRepo: ISharedLinkRepository,
    @inject("IChatRepository") private chatRepo: IChatRepository,
    @inject("IMessageRepository") private messageRepo: IMessageRepository,
    @inject("IFolderRepository") private folderRepo: IFolderRepository
  ) {}

  async execute(token: string, chatId?: string): Promise<any> {
    const link = await this.shareLinkRepo.findByToken(token);
    if (!link) {
      throw new AppError("Shared link not found or expired", 404);
    }

   
      return link.shareRepo;
  }
  
}
