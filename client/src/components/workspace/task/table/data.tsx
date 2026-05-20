import {
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  TaskPriorityEnum,
  TaskStatusEnum,
} from "@/constant";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Ban,
  CheckCircle,
  Circle,
  Clock,
  Flame,
  PauseCircle,
} from "lucide-react";

const statusIcons = {
  [TaskStatusEnum.PENDING]: Circle,
  [TaskStatusEnum.IN_PROGRESS]: Clock,
  [TaskStatusEnum.DONE]: CheckCircle,
  [TaskStatusEnum.OVERDUE]: AlertTriangle,
  [TaskStatusEnum.ON_HOLD]: PauseCircle,
  [TaskStatusEnum.CRITICAL]: Flame,
  [TaskStatusEnum.CANCELLED]: Ban,
};

const priorityIcons = {
  [TaskPriorityEnum.LOW]: ArrowDown,
  [TaskPriorityEnum.MEDIUM]: ArrowRight,
  [TaskPriorityEnum.HIGH]: ArrowUp,
  [TaskPriorityEnum.CRITICAL]: Flame,
};

export const statuses = Object.values(TaskStatusEnum).map((value) => ({
  label: TASK_STATUS_CONFIG[value].label,
  value,
  icon: statusIcons[value],
}));

export const priorities = Object.values(TaskPriorityEnum).map((value) => ({
  label: TASK_PRIORITY_CONFIG[value].label,
  value,
  icon: priorityIcons[value],
}));
