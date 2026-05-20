import { TaskType, TaskUserType } from "@/types/api.type";

/** First assignee for list cells that show a single avatar. */
export const getPrimaryAssignee = (task: TaskType): TaskUserType | null =>
  task.assignees[0] ?? null;
