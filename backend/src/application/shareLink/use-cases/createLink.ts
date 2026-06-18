import { inject, injectable } from "tsyringe";
import crypto from "crypto";
import { ISharedLinkRepository } from "../../../domain/shareLink/repositories/ISharedLinkRepository";
import { ISharedLink } from "../../../domain/shareLink/entities/ShareLink";

@injectable()
export class CreateLink {
  constructor(
    @inject("ISharedLinkRepository") private shareLinkRepo: ISharedLinkRepository
  ) {}

  async execute(input: {
    creatorId: string;
    targetId: string;
    targetType: "chat" | "folder";
    behaviorSharingPolicy?: "READ_ONLY" | "READ_WRITE" | "INVISIBLE";
  }): Promise<ISharedLink> {
    const token = crypto.randomBytes(32).toString("hex");

    

    const link: ISharedLink = {
      creatorId: input.creatorId,
      targetId: input.targetId,
      targetType: input.targetType,
      token,
      behaviorSharingPolicy: input.behaviorSharingPolicy || "READ_ONLY",
    };

    await this.shareLinkRepo.create(link);
    return link;
  }
}