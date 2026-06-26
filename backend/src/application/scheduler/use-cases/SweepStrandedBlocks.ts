import { injectable, inject } from 'tsyringe';
import { ICodeBlockRepository } from '../../../domain/chat/repositories/ICodeBlockRepository';
import { IDescriptionPublisher } from '../../common/ports/IDescriptionPublisher';

@injectable()
export class SweepStrandedBlocks {
  constructor(
    @inject("ICodeBlockRepository") private codeBlockRepository: ICodeBlockRepository,
    @inject("IDescriptionPublisher") private descriptionPublisher: IDescriptionPublisher
  ) {}

  async execute() {
    const TEN_MIN_AGO = new Date(Date.now() - 10 * 60 * 1000);
    const strandedBlocks = await this.codeBlockRepository.findStrandedBlocks(50, TEN_MIN_AGO);

    if (strandedBlocks.length === 0) {
      return;
    }

    console.log(`[Description Sweeper] Found ${strandedBlocks.length} stranded code blocks without descriptions.`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queuePayload = strandedBlocks.map((b: any) => ({
      _id: b._id.toString(),
      userId: b.userId.toString(),
      chatId: b.chatId.toString(),
      code: b.code,
      language: b.language,
      hash: b.hash,
    }));

    await this.descriptionPublisher.publish(queuePayload);
    console.log(`[Description Sweeper] Re-queued ${queuePayload.length} stranded blocks successfully!`);
  }
}
