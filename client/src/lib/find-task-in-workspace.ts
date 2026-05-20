import { fetchAllWorkspaceTasks } from "./fetch-all-workspace-tasks";
import { TaskType } from "@/types/api.type";

export const findTaskInWorkspace = async (
  workspaceId: string,
  taskId: string
): Promise<TaskType | null> => {
  const tasks = await fetchAllWorkspaceTasks(workspaceId);
  return tasks.find((task) => task._id === taskId) ?? null;
};
