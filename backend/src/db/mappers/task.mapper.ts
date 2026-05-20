import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { pickProjectPublic, pickUserPublic } from "./document.mapper";

const TERMINAL_STATUSES: TaskStatus[] = [TaskStatus.DONE, TaskStatus.CANCELLED];

/** Only these stored statuses may be auto-displayed as OVERDUE when past target date. */
const OVERDUE_ELIGIBLE_STATUSES: TaskStatus[] = [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
];

const buildOverdueDisplayBranches = (
  now: Date
): Prisma.TaskWhereInput[] => [
  { status: TaskStatus.OVERDUE },
  {
    status: { in: [...OVERDUE_ELIGIBLE_STATUSES] },
    targetDate: { not: null, lt: now },
  },
];

/**
 * Prisma filter matching resolveDisplayStatus → OVERDUE:
 * stored OVERDUE, or (PENDING|IN_PROGRESS with targetDate in the past).
 */
export const buildOverdueFilterWhere = (
  now: Date = new Date()
): Prisma.TaskWhereInput => ({
  OR: buildOverdueDisplayBranches(now),
});

export const isValidTaskStatus = (value: string): value is TaskStatus =>
  Object.values(TaskStatus).includes(value as TaskStatus);

export const isValidTaskPriority = (value: string): value is TaskPriority =>
  Object.values(TaskPriority).includes(value as TaskPriority);

export const toPrismaTaskStatus = (status: string): TaskStatus => {
  if (isValidTaskStatus(status)) {
    return status;
  }
  return TaskStatus.PENDING;
};

export const toPrismaTaskPriority = (priority: string): TaskPriority => {
  if (isValidTaskPriority(priority)) {
    return priority;
  }
  return TaskPriority.MEDIUM;
};

export const prismaStatusesFromApi = (statuses: string[]): TaskStatus[] =>
  [...new Set(statuses.filter(isValidTaskStatus))];

export const prismaPrioritiesFromApi = (priorities: string[]): TaskPriority[] =>
  [...new Set(priorities.filter(isValidTaskPriority))];

export const resolveDisplayStatus = (
  storedStatus: TaskStatus,
  targetDate: Date | null,
  now: Date = new Date()
): TaskStatus => {
  if (
    targetDate &&
    targetDate < now &&
    OVERDUE_ELIGIBLE_STATUSES.includes(storedStatus)
  ) {
    return TaskStatus.OVERDUE;
  }
  return storedStatus;
};

type PrismaTaskWithRelations = {
  id: string;
  taskCode: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: Date | null;
  targetDate: Date | null;
  startedOn: Date | null;
  completedOn: Date | null;
  recurrence: Prisma.JsonValue | null;
  category: string | null;
  tags: string[];
  attachments: Prisma.JsonValue | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  parentTaskId: string | null;
  treePath: string | null;
  level: number;
  workspaceId: string;
  projectId: string;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: { id: string; emoji: string; name: string } | null;
  assignees?: Array<{
    user: { id: string; name: string | null; profilePicture: string | null };
  }>;
};

export type TaskApiDto = {
  _id: string;
  taskCode: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: Date | null;
  targetDate: Date | null;
  startedOn: Date | null;
  completedOn: Date | null;
  recurrence: Prisma.JsonValue | null;
  category: string | null;
  tags: string[];
  attachments: Prisma.JsonValue | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  parentTaskId: string | null;
  treePath: string | null;
  level: number;
  workspaceId: string;
  projectId: string;
  createdById: string;
  updatedById: string | null;
  assignees: ReturnType<typeof pickUserPublic>[];
  project: ReturnType<typeof pickProjectPublic> | { _id: string };
  createdAt: Date;
  updatedAt: Date;
};

export const mapPrismaTaskToApi = (task: PrismaTaskWithRelations): TaskApiDto => {
  const status = resolveDisplayStatus(task.status, task.targetDate);

  return {
    _id: task.id,
    taskCode: task.taskCode,
    title: task.title,
    description: task.description,
    status,
    priority: task.priority,
    startDate: task.startDate,
    targetDate: task.targetDate,
    startedOn: task.startedOn,
    completedOn: task.completedOn,
    recurrence: task.recurrence,
    category: task.category,
    tags: task.tags ?? [],
    attachments: task.attachments,
    isDeleted: task.isDeleted,
    deletedAt: task.deletedAt,
    parentTaskId: task.parentTaskId,
    treePath: task.treePath,
    level: task.level,
    workspaceId: task.workspaceId,
    projectId: task.projectId,
    createdById: task.createdById,
    updatedById: task.updatedById,
    assignees: (task.assignees ?? []).map((row) => pickUserPublic(row.user)),
    project: task.project
      ? pickProjectPublic(task.project)
      : { _id: task.projectId },
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};
