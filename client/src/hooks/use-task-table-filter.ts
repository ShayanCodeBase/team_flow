import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

export const TASK_TABLE_SORT_FIELDS = [
  "title",
  "targetDate",
  "priority",
  "status",
  "createdAt",
] as const;

export type TaskTableSortField = (typeof TASK_TABLE_SORT_FIELDS)[number];

export type TaskTableSortOrder = "asc" | "desc";

const useTaskTableFilter = () => {
  return useQueryStates({
    status: parseAsStringEnum<TaskStatusEnumType>(
      Object.values(TaskStatusEnum)
    ),
    priority: parseAsStringEnum<TaskPriorityEnumType>(
      Object.values(TaskPriorityEnum)
    ),
    keyword: parseAsString,
    projectId: parseAsString,
    assigneeId: parseAsString,
    sortBy: parseAsStringEnum<TaskTableSortField>([...TASK_TABLE_SORT_FIELDS]),
    sortOrder: parseAsStringEnum<TaskTableSortOrder>(["asc", "desc"]),
  });
};

export default useTaskTableFilter;
