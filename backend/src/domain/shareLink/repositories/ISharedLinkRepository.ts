import { ISharedLink } from "../entities/ShareLink";

export interface ISharedLinkRepository {
  create(link:ISharedLink): Promise<void>;
  findByToken(token: string): Promise<ISharedLink | null>;
}