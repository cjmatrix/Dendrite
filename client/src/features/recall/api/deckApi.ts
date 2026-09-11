import api from "../../../lib/axios";

export interface Deck {
  _id: string;
  userId: string;
  name: string;
  color: string;
  cardCount?: number;
  dueCardCount?: number;
  createdAt: string;
}

export interface DeckStats {
  byDeck: Record<string, { cardCount: number; dueCardCount: number }>;
  undecked: { cardCount: number; dueCardCount: number };
  total: { cardCount: number; dueCardCount: number };
}

export const getDecks = async (): Promise<Deck[]> => {
  const res = await api.get("/deck");
  return res.data.data;
};

export const getDeckStats = async (): Promise<DeckStats> => {
  const res = await api.get("/deck/stats");
  return res.data.data;
};

export const createDeck = async (name: string, color?: string): Promise<Deck> => {
  const res = await api.post("/deck", { name, color });
  return res.data.data;
};

export const updateDeck = async (id: string, updates: { name?: string; color?: string }): Promise<Deck> => {
  const res = await api.patch(`/deck/${id}`, updates);
  return res.data.data;
};

export const deleteDeck = async (id: string): Promise<void> => {
  await api.delete(`/deck/${id}`);
};

export const moveCardToDeck = async (cardId: string, deckId: string | null): Promise<void> => {
  await api.patch("/deck/move-card", { cardId, deckId });
};

export const moveCardsToDeck = async (fromDeckId: string | null, toDeckId: string | null): Promise<void> => {
  await api.patch("/deck/move-cards", { fromDeckId, toDeckId });
};
