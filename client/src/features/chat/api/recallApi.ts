import api from "../../../lib/axios";

export const saveRecallCard = async (content: string | null, chatId: string, msgId: string): Promise<void> => {
  await api.post("/recall/save", {
    content,
    chatId,
    msgId,
  });
};
