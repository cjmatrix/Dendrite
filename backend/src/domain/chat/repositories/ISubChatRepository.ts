import { IBaseRepository } from "../../../application/common/ports/IBaseRepository";
import { ISubChat } from "../entities/SubChat";

export interface ISubChatRepository extends IBaseRepository<ISubChat> {
  findByAnchorMessageIdsAndChatId(anchorMessageIds: any[], chatId: string, userId: string): Promise<ISubChat[]>;
  findByIdAndUserId(subChatId: string, chatId: string, userId: string): Promise<ISubChat | null>;
  update(subChatId: string, userId: string, updates: any): Promise<ISubChat | null>;
  deleteByChatId(chatId: string, userId: string): Promise<void>;
}
