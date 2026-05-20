import {
  TASK_STATUS_CONFIG,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";

/** Column order on the Kanban board. */
export const KANBAN_COLUMN_ORDER: TaskStatusEnumType[] = [
  TaskStatusEnum.PENDING,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.ON_HOLD,
  TaskStatusEnum.OVERDUE,
  TaskStatusEnum.CRITICAL,
  TaskStatusEnum.DONE,
  TaskStatusEnum.CANCELLED,
];

/** Dot colors aligned with TASK_STATUS_CONFIG badge palette. */
export const STATUS_DOT_CLASS: Record<TaskStatusEnumType, string> = {
  PENDING: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-green-500",
  OVERDUE: "bg-red-500",
  ON_HOLD: "bg-yellow-500",
  CRITICAL: "bg-red-900",
  CANCELLED: "bg-muted-foreground",
};

export const getStatusLabel = (status: TaskStatusEnumType): string =>
  TASK_STATUS_CONFIG[status].label;

export const emptyColumnsState = (): Record<TaskStatusEnumType, never[]> =>
  Object.fromEntries(
    KANBAN_COLUMN_ORDER.map((status) => [status, []])
  ) as Record<TaskStatusEnumType, never[]>;
