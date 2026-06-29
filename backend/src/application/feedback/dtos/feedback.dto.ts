import { z } from "zod";

export const CreateFeedbackInputSchema = z.object({
  content: z.string().min(1, "Feedback content cannot be empty").max(2000, "Feedback is too long"),
  rating: z.number().min(1).max(5).optional(),
});

export const UpdateFeedbackStatusSchema = z.object({
  status: z.enum(["new", "reviewed", "resolved"]),
});

export const FeedbackIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Feedback ID format"),
});
