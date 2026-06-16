import { z } from "zod";

export const CreateFolderInputSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(100, "Folder name must be less than 100 characters"),
  parentId: z.string().nullable().optional().default(null),
});

export type CreateFolderInputDTO = z.infer<typeof CreateFolderInputSchema>;

export const UpdateFolderInputSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(100, "Folder name must be less than 100 characters").optional(),
  isExpanded: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
});

export type UpdateFolderInputDTO = z.infer<typeof UpdateFolderInputSchema>;

export const UpdateFolderBehaviorInputSchema = z.object({
  content: z.string().min(1, "Behavior content is required"),
});

export type UpdateFolderBehaviorInputDTO = z.infer<typeof UpdateFolderBehaviorInputSchema>;

export const FolderIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid folder ID format"),
});

export type FolderIdParamDTO = z.infer<typeof FolderIdParamSchema>;
