import { taskActivityRepository, taskRepository } from "../db/repositories";
import { TaskActivityActionType } from "../enums/task-activity.enum";
import { NotFoundException } from "../utils/appError";

export type LogActivityParams = {
  taskId: string;
  userId: string;
  action: TaskActivityActionType;
  metadata?: Record<string, unknown>;
};

export const logActivity = async ({
  taskId,
  userId,
  action,
  metadata,
}: LogActivityParams): Promise<void> => {
  await taskActivityRepository.create({
    taskId,
    userId,
    action,
    metadata,
  });
};

export const listTaskActivitiesService = async (
  taskId: string,
  workspaceId: string,
  pagination: { pageNumber: number; pageSize: number }
) => {
  const task = await taskRepository.findById(taskId, workspaceId);
  if (!task) {
    throw new NotFoundException("Task not found");
  }

  const { pageNumber, pageSize } = pagination;
  const { activities, totalCount } =
    await taskActivityRepository.findManyByTaskId(
      taskId,
      pageNumber,
      pageSize
    );

  return { activities, totalCount };
};

const WORKSPACE_ACTIVITY_LIMIT = 20;

export const listWorkspaceActivitiesService = async (workspaceId: string) => {
  const activities = await taskActivityRepository.findRecentByWorkspaceId(
    workspaceId,
    WORKSPACE_ACTIVITY_LIMIT
  );

  return { activities };
};
