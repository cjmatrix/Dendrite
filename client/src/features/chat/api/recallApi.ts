import api from "../../../lib/axios";

export const saveRecallCard = async (content: string | null, chatId: string, msgId: string, deckId?: string | null): Promise<void> => {
  await api.post("/recall/save", {
    content,
    chatId,
    msgId,
    deckId: deckId ?? null,
  });
};

export const updateRecallQuestion = async (cardId: string, question: string): Promise<any> => {
  const res = await api.patch(`/recall/question/${cardId}`, { question });
  return res.data;
};
