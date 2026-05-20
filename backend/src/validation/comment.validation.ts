import { z } from "zod";

export const commentIdSchema = z
  .string()
  .trim()
  .uuid({ message: "Invalid comment id" });

export const commentContentSchema = z
  .string()
  .trim()
  .min(1, { message: "Comment content is required" })
  .max(2000, { message: "Comment must be at most 2000 characters" });

export const createCommentSchema = z.object({
  content: commentContentSchema,
});

export const updateCommentSchema = z.object({
  content: commentContentSchema,
});

export const listCommentsQuerySchema = z.object({
  pageNumber: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
