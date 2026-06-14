import { inject, injectable } from "tsyringe";
import { ISharedLink } from "../../../domain/shareLink/entities/ShareLink";
import { ISharedLinkRepository } from "../../../domain/shareLink/repositories/ISharedLinkRepository";
import { ICacheService } from "../../../application/common/ports/ICacheService";


@injectable()
export class RedisShareLinkRepository implements ISharedLinkRepository{

    constructor(@inject("ICacheService") private cacheService:ICacheService){}

    async create(link: ISharedLink): Promise<void> {
        const key = `sharelink:${link.token}`;
        await this.cacheService.set(key,JSON.stringify(link),{EX:2592000})
    }

    async findByToken(token: string): Promise<ISharedLink|null> {

        const key = `sharelink:${token}`;
    const rawData = await this.cacheService.get(key);

    if (!rawData) return null;

    const data = JSON.parse(rawData);

    return data
    }
    
}