import type { IBranchRepository } from "../../domain/repositories/IChatRepository";
import api from "../../../api/axios";

export class ApiBranchRepository implements IBranchRepository {
  async inheritContext(chatId: string, contextParentId: string): Promise<void> {
    await api.patch(`/branch/inherit/${chatId}`, { contextParentId });
  }
}
