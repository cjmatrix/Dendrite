import { IBaseRepository } from "../../../application/common/ports/IBaseRepository";
import { IChat } from "../entities/Chat";

export interface IChatRepository extends IBaseRepository<IChat> {
  findByUserIdAndTitleAndFolderId(userId: string, title: string, folderId: string | null): Promise<IChat | null>;
  findAllByUserId(userId: string): Promise<IChat[]>;
  findByIdAndUserId(chatId: string, userId: string, options?: any): Promise<IChat | null>;
  update(chatId: string, userId: string, updates: any, options?: any): Promise<IChat | null>;
  bulkResetUnsummarizedCount(chatIds: string[], userId: string, options?: any): Promise<any>;
  delete(chatId: string, userId: string): Promise<IChat | null>;
  findByFolderIds(userId: string, folderIds: string[]): Promise<IChat[]>;
  deleteManyByFolderIds(userId: string, folderIds: string[]): Promise<any>;
  addDocumentToChat({chatId, userId}: {chatId: string, userId: string}, documentData: {
    fileType: 'image' | 'document';
    filename: string;
    extension: string;
    fileUrl: string;
  }): Promise<IChat | null>;
  findByFolderIdsWithoutUserId(folderIds: string[]): Promise<IChat[]>;
}
