export interface IFeedback {
  _id: string;
  userId: string;
  content: string;
  rating?: number;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt?: Date;
}

export interface IFeedbackRepository {
  create(feedbackData: Partial<IFeedback>): Promise<IFeedback>;
  findAll(): Promise<IFeedback[]>;
  findById(id: string): Promise<IFeedback | null>;
  updateStatus(id: string, status: 'new' | 'reviewed' | 'resolved'): Promise<IFeedback | null>;
}
