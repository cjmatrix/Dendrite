import { injectable } from "tsyringe";
import { IFeedbackRepository, IFeedback } from "../../../domain/feedback/repositories/IFeedbackRepository";
import FeedbackModel from "../models/MongoFeedbackModel";

@injectable()
export class FeedbackRepository implements IFeedbackRepository {
  private mapToIFeedback(doc: {
    _id: { toString(): string };
    userId: string | { _id?: { toString(): string }; toString(): string } | { toString(): string };
    content: string;
    rating?: number | null;
    status: 'new' | 'reviewed' | 'resolved';
    createdAt?: Date | null;
  }): IFeedback {
    return {
      _id: doc._id.toString(),
      userId: typeof doc.userId === 'object' && doc.userId !== null && '_id' in doc.userId
        ? (doc.userId as { _id: { toString(): string } })._id.toString()
        : doc.userId ? doc.userId.toString() : "",
      content: doc.content,
      rating: doc.rating ?? undefined,
      status: doc.status,
      createdAt: doc.createdAt ?? undefined
    };
  }

  async create(feedbackData: Partial<IFeedback>): Promise<IFeedback> {
    const feedback = await FeedbackModel.create(feedbackData);
    return this.mapToIFeedback(feedback.toObject());
  }

  async findAll(): Promise<IFeedback[]> {
    const feedbacks = await FeedbackModel.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .lean();
    return feedbacks.map(f => this.mapToIFeedback(f));
  }

  async findById(id: string): Promise<IFeedback | null> {
    const feedback = await FeedbackModel.findById(id).lean();
    return feedback ? this.mapToIFeedback(feedback) : null;
  }

  async updateStatus(id: string, status: 'new' | 'reviewed' | 'resolved'): Promise<IFeedback | null> {
    const feedback = await FeedbackModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
    return feedback ? this.mapToIFeedback(feedback) : null;
  }
}
