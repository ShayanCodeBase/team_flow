import { z } from "zod";

export const notificationIdSchema = z
  .string()
  .trim()
  .uuid({ message: "Invalid notification id" });

export const listNotificationsQuerySchema = z.object({
  pageNumber: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
