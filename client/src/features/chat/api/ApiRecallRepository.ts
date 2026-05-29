import type { IRecallRepository } from "../../domain/repositories/IChatRepository";
import api from "../../../api/axios";

export class ApiRecallRepository implements IRecallRepository {
  async saveRecallCard(content: string | null, chatId: string, msgId: string): Promise<void> {
    await api.post("/recall/save", {
      content,
      chatId,
      msgId,
    });
  }
}
