import { ICodeBlockRepository } from '../../../domain/chat/repositories/ICodeBlockRepository';

export class SweepStrandedBlocks {
  constructor(
    private codeBlockRepository: ICodeBlockRepository,
    private queueAddFunction: (payload: any[]) => Promise<void>
  ) {}

  async execute() {
    const TEN_MIN_AGO = new Date(Date.now() - 10 * 60 * 1000);
    const strandedBlocks = await this.codeBlockRepository.findStrandedBlocks(50, TEN_MIN_AGO);

    if (strandedBlocks.length === 0) {
      return;
    }

    console.log(`[Description Sweeper] Found ${strandedBlocks.length} stranded code blocks without descriptions.`);

    const queuePayload = strandedBlocks.map((b: any) => ({
      _id: b._id.toString(),
      userId: b.userId.toString(),
      chatId: b.chatId.toString(),
      code: b.code,
      language: b.language,
      hash: b.hash,
    }));

    await this.queueAddFunction(queuePayload);
    console.log(`[Description Sweeper] Re-queued ${queuePayload.length} stranded blocks successfully!`);
  }
}
