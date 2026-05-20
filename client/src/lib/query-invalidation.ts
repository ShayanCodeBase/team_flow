import { QueryClient } from "@tanstack/react-query";
import { TaskType } from "@/types/api.type";

type TaskInvalidationOptions = {
  workspaceId: string;
  projectId?: string;
};

/** Matches useQuery key: ["task-activities", workspaceId, taskId, page]. */
export const invalidateTaskActivityQueries = (
  queryClient: QueryClient,
  workspaceId: string,
  taskId?: string
) => {
  if (taskId) {
    queryClient.invalidateQueries({
      queryKey: ["task-activities", workspaceId, taskId],
    });
    return;
  }
  queryClient.invalidateQueries({ queryKey: ["task-activities"] });
};

/** Matches useQuery keys: all-tasks, kanban-tasks, task-children, task-hierarchy-root, analytics. */
export const invalidateTaskQueries = (
  queryClient: QueryClient,
  { workspaceId, projectId, taskId }: TaskInvalidationOptions & { taskId?: string }
) => {
  queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
  queryClient.invalidateQueries({ queryKey: ["tasks-due-today"] });
  queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
  queryClient.invalidateQueries({ queryKey: ["task-children"] });
  queryClient.invalidateQueries({ queryKey: ["task-hierarchy-root"] });
  queryClient.invalidateQueries({
    queryKey: ["workspace-analytics", workspaceId],
  });
  invalidateTaskActivityQueries(queryClient, workspaceId, taskId);
  queryClient.invalidateQueries({
    queryKey: ["workspace-activity", workspaceId],
  });
  if (projectId) {
    queryClient.invalidateQueries({
      queryKey: ["project-analytics", projectId],
    });
  }
};

/** Lighter invalidation after creating a subtask — avoids refetching entire workspace task lists. */
export const invalidateSubtaskQueries = (
  queryClient: QueryClient,
  {
    workspaceId,
    projectId,
    parentTaskId,
    rootTaskId,
  }: {
    workspaceId: string;
    projectId: string;
    parentTaskId: string;
    rootTaskId?: string;
  }
) => {
  queryClient.invalidateQueries({
    queryKey: ["task-children", workspaceId, projectId, parentTaskId],
  });

  if (rootTaskId && rootTaskId !== parentTaskId) {
    queryClient.invalidateQueries({
      queryKey: ["task-hierarchy-root", workspaceId, projectId, rootTaskId],
    });
  }

  queryClient.invalidateQueries({
    queryKey: ["all-tasks"],
    refetchType: "active",
  });
};

export const prependTaskToChildrenCache = (
  queryClient: QueryClient,
  {
    workspaceId,
    projectId,
    parentTaskId,
    task,
  }: {
    workspaceId: string;
    projectId: string;
    parentTaskId: string;
    task: TaskType;
  }
) => {
  const key = ["task-children", workspaceId, projectId, parentTaskId] as const;
  queryClient.setQueryData<{ tasks: TaskType[] }>(key, (old) => {
    const existing = old?.tasks ?? [];
    if (existing.some((t) => t._id === task._id)) {
      return old ?? { tasks: existing };
    }
    return { tasks: [task, ...existing] };
  });
};

/** Matches useQuery key: ["task-comments", workspaceId, taskId, page]. */
export const invalidateCommentQueries = (
  queryClient: QueryClient,
  workspaceId: string,
  taskId: string
) => {
  queryClient.invalidateQueries({
    queryKey: ["task-comments", workspaceId, taskId],
  });
  invalidateTaskActivityQueries(queryClient, workspaceId, taskId);
  queryClient.invalidateQueries({
    queryKey: ["workspace-activity", workspaceId],
  });
};

type ProjectInvalidationOptions = {
  workspaceId: string;
  projectId?: string;
};

/** Matches useQuery keys: allprojects, singleProject, project-analytics, workspace-analytics. */
export const invalidateProjectQueries = (
  queryClient: QueryClient,
  { workspaceId, projectId }: ProjectInvalidationOptions
) => {
  queryClient.invalidateQueries({ queryKey: ["allprojects"] });
  queryClient.invalidateQueries({
    queryKey: ["workspace-analytics", workspaceId],
  });
  if (projectId) {
    queryClient.invalidateQueries({
      queryKey: ["singleProject", projectId],
    });
    queryClient.invalidateQueries({
      queryKey: ["project-analytics", projectId],
    });
  }
};

/** Matches useQuery key: ["members", workspaceId]. */
export const invalidateMemberQueries = (
  queryClient: QueryClient,
  workspaceId: string
) => {
  queryClient.invalidateQueries({
    queryKey: ["members", workspaceId],
  });
};
