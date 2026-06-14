import { IBaseRepository } from "../../../application/common/ports/IBaseRepository";
import { IContentHash } from "../entities/ContentHash";

export interface IContentHashRepository extends IBaseRepository<IContentHash> {
  findByHash(contentHash: string): Promise<IContentHash | null>;
  findExpired(now: Date): Promise<IContentHash[]>;
  deleteByHash(contentHash: string): Promise<boolean>;
}
