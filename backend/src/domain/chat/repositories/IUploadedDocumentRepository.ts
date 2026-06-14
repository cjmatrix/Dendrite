import { IBaseRepository } from "../../../application/common/ports/IBaseRepository";
import { IUploadedDocument } from "../entities/UploadedDocument";

export interface IUploadedDocumentRepository extends IBaseRepository<IUploadedDocument> {
  findByChatId(chatId: string): Promise<IUploadedDocument[]>;
  findByChatIds(chatIds: string[]): Promise<IUploadedDocument[]>;
  delete(id: string): Promise<boolean>;
  deleteManyByChatIds(chatIds: string[]): Promise<boolean>;
  countByContentHash(contentHash: string): Promise<number>;
  findByChatIdAndFilename(chatId: string, filename: string): Promise<IUploadedDocument | null>;
  findByChatIdAndFileUrl(chatId: string, fileUrl: string): Promise<IUploadedDocument | null>;
}
