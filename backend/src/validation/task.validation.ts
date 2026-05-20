import { z } from "zod";
import {
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
} from "../enums/task.enum";

export const titleSchema = z.string().trim().min(1).max(255);
export const descriptionSchema = z.string().trim().optional();

export const prioritySchema = z.enum(TASK_PRIORITY_VALUES);

export const statusSchema = z.enum(TASK_STATUS_VALUES);

const isoDateStringSchema = z
  .string()
  .trim()
  .optional()
  .refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Invalid date format. Please provide a valid ISO date string.",
  });

export const optionalDateSchema = isoDateStringSchema;

export const taskIdSchema = z.string().trim().uuid({ message: "Invalid task id" });

export const parentTaskIdSchema = z
  .string()
  .trim()
  .uuid({ message: "Invalid parent task id" })
  .nullable()
  .optional();

export const assigneesSchema = z
  .array(z.string().trim().uuid({ message: "Invalid assignee user id" }))
  .optional()
  .default([]);

export const tagsSchema = z.array(z.string().trim().min(1).max(100)).optional();

export const categorySchema = z.string().trim().max(255).optional();

/** Accepts `null` to clear recurrence on update; omit on create when not set. */
export const recurrenceSchema = z.record(z.unknown()).nullable().optional();

const taskFieldsSchema = {
  title: titleSchema,
  description: descriptionSchema,
  priority: prioritySchema,
  status: statusSchema,
  assignees: assigneesSchema,
  startDate: optionalDateSchema,
  targetDate: optionalDateSchema,
  startedOn: optionalDateSchema,
  completedOn: optionalDateSchema,
  tags: tagsSchema,
  category: categorySchema,
  recurrence: recurrenceSchema,
  parentTaskId: parentTaskIdSchema,
};

export const createTaskSchema = z.object(taskFieldsSchema);

export const createSubtaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  priority: prioritySchema,
  status: statusSchema,
  assignees: assigneesSchema,
  startDate: optionalDateSchema,
  targetDate: optionalDateSchema,
  startedOn: optionalDateSchema,
  completedOn: optionalDateSchema,
  tags: tagsSchema,
  category: categorySchema,
  recurrence: recurrenceSchema,
});

export const moveTaskSchema = z.object({
  newParentId: z
    .string()
    .trim()
    .uuid({ message: "Invalid parent task id" })
    .nullable(),
});

export const updateTaskSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema,
  priority: prioritySchema.optional(),
  status: statusSchema.optional(),
  assignees: assigneesSchema.optional(),
  startDate: optionalDateSchema,
  targetDate: optionalDateSchema,
  startedOn: optionalDateSchema,
  completedOn: optionalDateSchema,
  tags: tagsSchema,
  category: categorySchema,
  recurrence: recurrenceSchema,
});

export const taskListQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  keyword: z.string().optional(),
  dueDate: z.string().optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  rootOnly: z.enum(["true", "false"]).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  pageNumber: z.coerce.number().int().min(1).optional(),
  sortBy: z
    .enum([
      "title",
      "status",
      "priority",
      "targetDate",
      "startDate",
      "createdAt",
      "updatedAt",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
