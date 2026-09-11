import { z } from "zod";

export const CreateCardInputSchema = z.object({
  content: z.string().trim().nullable().optional(),
  chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid chat ID format"),
  msgId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid message ID format").optional(),
  deckId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid deck ID format").nullable().optional(),
}).refine((data) => data.content || data.msgId, {
  message: "Either card content or message ID is required",
  path: ["content"],
});

export type CreateCardInputDTO = z.infer<typeof CreateCardInputSchema>;

export const UpdateCardInputSchema = z.object({
  rating: z.coerce.number().int().min(0).max(5, "Rating must be between 0 and 5"),
});

export type UpdateCardInputDTO = z.infer<typeof UpdateCardInputSchema>;

export const CardIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid card ID format"),
});

export type CardIdParamDTO = z.infer<typeof CardIdParamSchema>;

export const UpdateQuestionInputSchema = z.object({
  question: z.string().trim().min(1, "Question cannot be empty"),
});

export type UpdateQuestionInputDTO = z.infer<typeof UpdateQuestionInputSchema>;
