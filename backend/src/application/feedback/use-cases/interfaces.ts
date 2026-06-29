import { IFeedback } from "../../../domain/feedback/repositories/IFeedbackRepository";

export interface ICreateFeedbackUseCase {
  execute(userId: string, content: string, rating?: number): Promise<IFeedback>;
}

export interface IGetAllFeedbackUseCase {
  execute(): Promise<IFeedback[]>;
}

export interface IUpdateFeedbackStatusUseCase {
  execute(id: string, status: 'new' | 'reviewed' | 'resolved'): Promise<IFeedback | null>;
}
