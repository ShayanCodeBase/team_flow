import { Prisma } from "@prisma/client";

export type TaskSortField =
  | "title"
  | "status"
  | "priority"
  | "targetDate"
  | "startDate"
  | "createdAt"
  | "updatedAt";

export type TaskFilters = {
  workspaceId: string;
  projectId?: string;
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  keyword?: string;
  dueDate?: string;
  dueBefore?: string;
  dueAfter?: string;
  parentTaskId?: string | null;
  includeDeleted?: boolean;
  sortBy?: TaskSortField;
  sortOrder?: "asc" | "desc";
};

export type PaginationInput = {
  pageSize: number;
  pageNumber: number;
};

export type TaskCreateInput = {
  workspaceId: string;
  projectId: string;
  createdById: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assignees?: string[];
  startDate?: string;
  targetDate?: string;
  startedOn?: string;
  completedOn?: string;
  tags?: string[];
  category?: string;
  recurrence?: Record<string, unknown> | null;
  parentTaskId?: string | null;
};

export type TaskUpdateInput = {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  assignees?: string[];
  startDate?: string | null;
  targetDate?: string | null;
  startedOn?: string | null;
  completedOn?: string | null;
  tags?: string[];
  category?: string | null;
  recurrence?: Record<string, unknown> | null;
  updatedById: string;
};

export type TaskAnalytics = {
  totalTasks: number;
  overdueTasks: number;
  completedTasks: number;
};

export type RecurrenceJson = Prisma.InputJsonValue;
