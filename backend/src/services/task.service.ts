import { TaskApiDto } from "../db/mappers/task.mapper";
import { NotificationType } from "../enums/notification-type.enum";
import { TaskActivityAction } from "../enums/task-activity.enum";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";
import {
  memberRepository,
  projectRepository,
  taskRepository,
  userRepository,
} from "../db/repositories";
import { TaskSortField, TaskUpdateInput } from "../db/repositories/types";
import {
  BadRequestException,
  NotFoundException,
} from "../utils/appError";
import { logActivity } from "./task-activity.service";
import { notificationService } from "./notification.service";

type RecurrenceType = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
type RecurrenceUnit = "day" | "week" | "month";

type RecurrenceRule = {
  type: RecurrenceType;
  interval?: number;
  unit?: RecurrenceUnit;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRecurrenceRule = (value: unknown): value is RecurrenceRule => {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }
  if (
    value.type !== "DAILY" &&
    value.type !== "WEEKLY" &&
    value.type !== "MONTHLY" &&
    value.type !== "CUSTOM"
  ) {
    return false;
  }
  if (value.type === "CUSTOM") {
    if (value.interval !== undefined && typeof value.interval !== "number") {
      return false;
    }
    if (
      value.unit !== undefined &&
      value.unit !== "day" &&
      value.unit !== "week" &&
      value.unit !== "month"
    ) {
      return false;
    }
  }
  return true;
};

const toDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const calculateNextTargetDate = (
  currentTargetDate: Date | string | null | undefined,
  recurrence: RecurrenceRule
): string | undefined => {
  const base = toDate(currentTargetDate) ?? new Date();

  switch (recurrence.type) {
    case "DAILY":
      return addDays(base, 1).toISOString();
    case "WEEKLY":
      return addDays(base, 7).toISOString();
    case "MONTHLY":
      return addMonths(base, 1).toISOString();
    case "CUSTOM": {
      const interval =
        typeof recurrence.interval === "number" && recurrence.interval > 0
          ? recurrence.interval
          : 1;
      const unit = recurrence.unit ?? "day";
      if (unit === "week") {
        return addDays(base, interval * 7).toISOString();
      }
      if (unit === "month") {
        return addMonths(base, interval).toISOString();
      }
      return addDays(base, interval).toISOString();
    }
    default:
      return undefined;
  }
};

const toIsoOrUndefined = (value: Date | null | undefined): string | undefined =>
  value ? value.toISOString() : undefined;

const toActivityDateValue = (
  value: Date | string | null | undefined
): string | null => {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const notifyAssigneesAdded = async (
  assignerId: string,
  assignerName: string,
  task: TaskApiDto,
  addedAssigneeIds: string[]
) => {
  await Promise.all(
    addedAssigneeIds
      .filter((assigneeId) => assigneeId !== assignerId)
      .map((assigneeId) =>
        notificationService.createAndSend(
          assigneeId,
          NotificationType.TASK_ASSIGNED,
          "You were assigned a task",
          `${assignerName} assigned you to ${task.title}`,
          { taskId: task._id, workspaceId: task.workspaceId }
        )
      )
  );
};

const logAssigneeChanges = async (
  taskId: string,
  userId: string,
  taskBefore: TaskApiDto,
  nextAssigneeIds: string[],
  taskAfter: TaskApiDto
) => {
  const previousAssignees = taskBefore.assignees;
  const previousIds = new Set(previousAssignees.map((assignee) => assignee._id));
  const nextIds = new Set(nextAssigneeIds);

  const addedIds = nextAssigneeIds.filter((id) => !previousIds.has(id));
  const removedAssignees = previousAssignees.filter(
    (assignee) => !nextIds.has(assignee._id)
  );

  const assigner = await userRepository.findById(userId);
  const assignerName = assigner?.name ?? "Someone";

  await Promise.all([
    ...addedIds.map(async (assigneeId) => {
      const user = await userRepository.findById(assigneeId);
      await logActivity({
        taskId,
        userId,
        action: TaskActivityAction.ASSIGNEE_ADDED,
        metadata: { userName: user?.name ?? "Unknown" },
      });
    }),
    ...removedAssignees.map((assignee) =>
      logActivity({
        taskId,
        userId,
        action: TaskActivityAction.ASSIGNEE_REMOVED,
        metadata: { userName: assignee.name ?? "Unknown" },
      })
    ),
  ]);

  if (addedIds.length > 0) {
    void notifyAssigneesAdded(userId, assignerName, taskAfter, addedIds).catch(
      (err) => console.error("Failed to notify assignees:", err)
    );
  }
};

const logTaskFieldUpdates = async (
  taskId: string,
  userId: string,
  taskBefore: TaskApiDto,
  taskAfter: TaskApiDto,
  body: Omit<TaskUpdateInput, "updatedById">
) => {
  if (body.status !== undefined && body.status !== taskBefore.status) {
    await logActivity({
      taskId,
      userId,
      action: TaskActivityAction.STATUS_CHANGED,
      metadata: { from: taskBefore.status, to: body.status },
    });
  }

  if (body.priority !== undefined && body.priority !== taskBefore.priority) {
    await logActivity({
      taskId,
      userId,
      action: TaskActivityAction.PRIORITY_CHANGED,
      metadata: { from: taskBefore.priority, to: body.priority },
    });
  }

  if (body.title !== undefined && body.title !== taskBefore.title) {
    await logActivity({
      taskId,
      userId,
      action: TaskActivityAction.TASK_UPDATED,
      metadata: { field: "title" },
    });
  }

  if (
    body.description !== undefined &&
    (body.description ?? "") !== (taskBefore.description ?? "")
  ) {
    await logActivity({
      taskId,
      userId,
      action: TaskActivityAction.TASK_UPDATED,
      metadata: { field: "description" },
    });
  }

  if (body.targetDate !== undefined) {
    const fromDate = toActivityDateValue(taskBefore.targetDate);
    const toDate = toActivityDateValue(body.targetDate);
    if (fromDate !== toDate) {
      await logActivity({
        taskId,
        userId,
        action: TaskActivityAction.DUE_DATE_CHANGED,
        metadata: { from: fromDate, to: toDate },
      });
    }
  }

  if (body.assignees !== undefined) {
    await logAssigneeChanges(
      taskId,
      userId,
      taskBefore,
      body.assignees,
      taskAfter
    );
  }
};

const spawnNextRecurrenceTask = async (
  completedTask: TaskApiDto,
  userId: string
) => {
  if (!isRecurrenceRule(completedTask.recurrence)) {
    return;
  }

  const recurrence = completedTask.recurrence;
  const assigneeIds = completedTask.assignees.map((assignee) => assignee._id);

  const newTask = await taskRepository.create({
    title: completedTask.title,
    description: completedTask.description ?? undefined,
    priority: completedTask.priority,
    status: TaskStatusEnum.PENDING,
    assignees: assigneeIds,
    startDate: toIsoOrUndefined(toDate(completedTask.startDate) ?? undefined),
    targetDate: calculateNextTargetDate(completedTask.targetDate, recurrence),
    tags: completedTask.tags ?? [],
    category: completedTask.category ?? undefined,
    recurrence: recurrence as Record<string, unknown>,
    createdById: userId,
    workspaceId: completedTask.workspaceId,
    projectId: completedTask.projectId,
    parentTaskId: completedTask.parentTaskId,
  });

  await logActivity({
    taskId: newTask._id,
    userId,
    action: TaskActivityAction.TASK_CREATED,
  });
};

type TaskWriteBody = {
  title: string;
  description?: string;
  priority: string;
  status: string;
  assignees?: string[];
  startDate?: string;
  targetDate?: string;
  startedOn?: string;
  completedOn?: string;
  tags?: string[];
  category?: string;
  recurrence?: Record<string, unknown> | null;
  parentTaskId?: string | null;
};

const assertAssigneesAreMembers = async (
  assigneeIds: string[],
  workspaceId: string
) => {
  for (const userId of assigneeIds) {
    const isMember = await memberRepository.exists({ userId, workspaceId });
    if (!isMember) {
      throw new BadRequestException(
        `User ${userId} is not a member of this workspace.`
      );
    }
  }
};

export const createTaskService = async (
  workspaceId: string,
  projectId: string,
  userId: string,
  body: TaskWriteBody
) => {
  const project = await projectRepository.findOneInWorkspace(
    projectId,
    workspaceId
  );

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const assignees = body.assignees ?? [];
  if (assignees.length > 0) {
    await assertAssigneesAreMembers(assignees, workspaceId);
  }

  const task = await taskRepository.create({
    title: body.title,
    description: body.description,
    priority: body.priority || TaskPriorityEnum.MEDIUM,
    status: body.status || TaskStatusEnum.PENDING,
    assignees,
    startDate: body.startDate,
    targetDate: body.targetDate,
    startedOn: body.startedOn,
    completedOn: body.completedOn,
    tags: body.tags,
    category: body.category,
    recurrence: body.recurrence,
    createdById: userId,
    workspaceId,
    projectId,
    parentTaskId: body.parentTaskId,
  });

  await logActivity({
    taskId: task._id,
    userId,
    action: TaskActivityAction.TASK_CREATED,
  });

  if (assignees.length > 0) {
    const assigner = await userRepository.findById(userId);
    const assignerName = assigner?.name ?? "Someone";
    void notifyAssigneesAdded(userId, assignerName, task, assignees).catch(
      (err) => console.error("Failed to notify assignees:", err)
    );
  }

  return { task };
};

export const updateTaskService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  userId: string,
  body: Omit<TaskUpdateInput, "updatedById">
) => {
  const project = await projectRepository.findOneInWorkspace(
    projectId,
    workspaceId
  );

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await taskRepository.findOneInProject(
    taskId,
    workspaceId,
    projectId
  );

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to this project"
    );
  }

  if (body.assignees !== undefined && body.assignees.length > 0) {
    await assertAssigneesAreMembers(body.assignees, workspaceId);
  }

  const updatedTask = await taskRepository.update(taskId, {
    ...body,
    updatedById: userId,
  });

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task");
  }

  const markedDone =
    body.status === TaskStatusEnum.DONE &&
    task.status !== TaskStatusEnum.DONE &&
    updatedTask.status === TaskStatusEnum.DONE;

  await logTaskFieldUpdates(taskId, userId, task, updatedTask, body);

  if (markedDone && updatedTask.recurrence) {
    await spawnNextRecurrenceTask(updatedTask, userId);
  }

  return { updatedTask };
};

export const getAllTasksService = async (
  workspaceId: string,
  filters: {
    projectId?: string;
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    keyword?: string;
    dueDate?: string;
    dueBefore?: string;
    dueAfter?: string;
    rootOnly?: boolean;
    sortBy?: TaskSortField;
    sortOrder?: "asc" | "desc";
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const { pageSize, pageNumber } = pagination;

  const { tasks, totalCount, skip } = await taskRepository.findMany(
    {
      workspaceId,
      projectId: filters.projectId,
      status: filters.status,
      priority: filters.priority,
      assignedTo: filters.assignedTo,
      keyword: filters.keyword,
      dueDate: filters.dueDate,
      dueBefore: filters.dueBefore,
      dueAfter: filters.dueAfter,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      ...(filters.rootOnly ? { parentTaskId: null } : {}),
    },
    { pageSize, pageNumber }
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    tasks,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

export const getTaskByIdService = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const project = await projectRepository.findOneInWorkspace(
    projectId,
    workspaceId
  );

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await taskRepository.findOneInProject(
    taskId,
    workspaceId,
    projectId
  );

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  return task;
};

export const createSubtaskService = async (
  workspaceId: string,
  projectId: string,
  parentTaskId: string,
  userId: string,
  body: Omit<TaskWriteBody, "parentTaskId">
) => {
  const parent = await taskRepository.findOneInProject(
    parentTaskId,
    workspaceId,
    projectId
  );

  if (!parent) {
    throw new NotFoundException(
      "Parent task not found or does not belong to this project"
    );
  }

  return createTaskService(workspaceId, projectId, userId, {
    ...body,
    parentTaskId,
  });
};

export const getTaskChildrenService = async (
  workspaceId: string,
  projectId: string,
  parentTaskId: string
) => {
  const parent = await taskRepository.findOneInProject(
    parentTaskId,
    workspaceId,
    projectId
  );

  if (!parent) {
    throw new NotFoundException("Parent task not found.");
  }

  const children = await taskRepository.getChildren(parentTaskId, workspaceId);
  return { tasks: children };
};

export const getTaskSubtreeService = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const task = await taskRepository.findOneInProject(
    taskId,
    workspaceId,
    projectId
  );

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  const subtree = await taskRepository.getSubtree(taskId, workspaceId);
  return { tasks: subtree };
};

export const moveTaskService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  newParentId: string | null,
  userId: string
) => {
  const task = await taskRepository.findOneInProject(
    taskId,
    workspaceId,
    projectId
  );

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  if (newParentId) {
    const newParent = await taskRepository.findOneInProject(
      newParentId,
      workspaceId,
      projectId
    );
    if (!newParent) {
      throw new NotFoundException("New parent task not found in this project.");
    }
  }

  try {
    const moved = await taskRepository.moveTask(
      taskId,
      newParentId,
      workspaceId,
      userId
    );
    if (!moved) {
      throw new NotFoundException("Task not found.");
    }

    await logActivity({
      taskId,
      userId,
      action: TaskActivityAction.TASK_MOVED,
      metadata: { newParentId },
    });

    return { task: moved };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("descendant")) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes("not found")) {
        throw new NotFoundException(error.message);
      }
    }
    throw error;
  }
};

export const deleteTaskService = async (
  workspaceId: string,
  taskId: string,
  userId: string
) => {
  const existing = await taskRepository.findById(taskId, workspaceId);

  if (!existing) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace"
    );
  }

  await logActivity({
    taskId,
    userId,
    action: TaskActivityAction.TASK_DELETED,
  });

  await taskRepository.delete(taskId, workspaceId);

  return;
};
