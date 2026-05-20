import { TaskStatusEnum, TaskStatusEnumType } from "@/constant";

/** Hex colors aligned with TASK_STATUS_CONFIG / calendar event borders */
export const TASK_STATUS_CHART_COLORS: Record<TaskStatusEnumType, string> = {
  [TaskStatusEnum.PENDING]: "#9ca3af",
  [TaskStatusEnum.IN_PROGRESS]: "#2563eb",
  [TaskStatusEnum.DONE]: "#16a34a",
  [TaskStatusEnum.OVERDUE]: "#dc2626",
  [TaskStatusEnum.ON_HOLD]: "#ca8a04",
  [TaskStatusEnum.CRITICAL]: "#7f1d1d",
  [TaskStatusEnum.CANCELLED]: "#d1d5db",
};
