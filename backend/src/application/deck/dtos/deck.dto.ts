import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const CreateDeckInputSchema = z.object({
  name: z.string().trim().min(1, "Deck name is required").max(100, "Deck name too long"),
  color: z.string().trim().optional(),
});

export type CreateDeckInputDTO = z.infer<typeof CreateDeckInputSchema>;

export const UpdateDeckInputSchema = z.object({
  name: z.string().trim().min(1, "Deck name is required").max(100, "Deck name too long").optional(),
  color: z.string().trim().optional(),
}).refine((data) => data.name || data.color, {
  message: "At least one field (name or color) must be provided",
});

export type UpdateDeckInputDTO = z.infer<typeof UpdateDeckInputSchema>;

export const DeckIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid deck ID format"),
});

export type DeckIdParamDTO = z.infer<typeof DeckIdParamSchema>;

export const MoveCardToDeckInputSchema = z.object({
  cardId: z.string().regex(objectIdRegex, "Invalid card ID format"),
  deckId: z.string().regex(objectIdRegex, "Invalid deck ID format").nullable(),
});

export type MoveCardToDeckInputDTO = z.infer<typeof MoveCardToDeckInputSchema>;

export const MoveCardsToDeckInputSchema = z.object({
  fromDeckId: z.string().regex(objectIdRegex, "Invalid deck ID format").nullable(),
  toDeckId: z.string().regex(objectIdRegex, "Invalid deck ID format").nullable(),
});

export type MoveCardsToDeckInputDTO = z.infer<typeof MoveCardsToDeckInputSchema>;
