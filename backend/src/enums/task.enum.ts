/** Mirrors Prisma `TaskStatus` enum (schema.prisma). */
export const TaskStatusEnum = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  OVERDUE: "OVERDUE",
  ON_HOLD: "ON_HOLD",
  CRITICAL: "CRITICAL",
  CANCELLED: "CANCELLED",
} as const;

/** Mirrors Prisma `TaskPriority` enum (schema.prisma). */
export const TaskPriorityEnum = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export type TaskStatusEnumType =
  (typeof TaskStatusEnum)[keyof typeof TaskStatusEnum];

export type TaskPriorityEnumType =
  (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum];

export const TASK_STATUS_VALUES = Object.values(TaskStatusEnum) as [
  TaskStatusEnumType,
  ...TaskStatusEnumType[],
];

export const TASK_PRIORITY_VALUES = Object.values(TaskPriorityEnum) as [
  TaskPriorityEnumType,
  ...TaskPriorityEnumType[],
];
