import { z } from "zod";

export const AgentWorkspaceBodySchema = z.object({
  message: z.string()
    .min(1, "Message is required")
    .max(16000, "Message cannot exceed 16,000 characters (approx. 4,000 tokens)"),
});

export type AgentWorkspaceBodyDTO = z.infer<typeof AgentWorkspaceBodySchema>;
