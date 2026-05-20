import { z } from "zod";

export const listTaskActivitiesQuerySchema = z.object({
  pageNumber: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
