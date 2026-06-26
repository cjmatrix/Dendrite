import { IBaseRepository } from "../../../application/common/ports/IBaseRepository";
import { IChat } from "../entities/Chat";

export interface IChatRepository extends IBaseRepository<IChat> {
  findByUserIdAndTitleAndFolderId(userId: string, title: string, folderId: string | null): Promise<IChat | null>;
  findAllByUserId(userId: string): Promise<IChat[]>;
  findByIdAndUserId(chatId: string, userId: string, options?: { session?: unknown }): Promise<IChat | null>;
  update(chatId: string, userId: string, updates: Partial<IChat>, options?: { session?: unknown }): Promise<IChat | null>;
  bulkResetUnsummarizedCount(chatIds: string[], userId: string, options?: { session?: unknown }): Promise<unknown>;
  delete(chatId: string, userId: string): Promise<IChat | null>;
  findByFolderIds(userId: string, folderIds: string[]): Promise<IChat[]>;
  deleteManyByFolderIds(userId: string, folderIds: string[]): Promise<unknown>;
  addDocumentToChat(
    { chatId, userId }: { chatId: string; userId: string },
    documentId: string,
  ): Promise<IChat | null>;
  findByFolderIdsWithoutUserId(folderIds: string[]): Promise<IChat[]>;
  createMany(chatsData: Partial<IChat>[], options?: { session?: unknown }): Promise<IChat[]>;
}
