import { z } from "zod";

export const InheritContextInputSchema = z.object({
  contextParentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid context parent ID format"),
});

export type InheritContextInputDTO = z.infer<typeof InheritContextInputSchema>;

export const ChatIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid chat ID format"),
});

export type ChatIdParamDTO = z.infer<typeof ChatIdParamSchema>;
