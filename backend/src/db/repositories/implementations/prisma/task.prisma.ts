import { Prisma, TaskStatus } from "@prisma/client";
import prisma from "../../../prisma/client";
import { generateTaskCode } from "../../../../utils/uuid";
import {
  buildOverdueFilterWhere,
  mapPrismaTaskToApi,
  prismaPrioritiesFromApi,
  prismaStatusesFromApi,
  toPrismaTaskPriority,
  toPrismaTaskStatus,
} from "../../../mappers/task.mapper";
import {
  PaginationInput,
  TaskAnalytics,
  TaskCreateInput,
  TaskFilters,
  TaskSortField,
  TaskUpdateInput,
} from "../../types";
import * as taskAssigneePrisma from "./taskAssignee.prisma";

const taskInclude = {
  project: { select: { id: true, emoji: true, name: true } },
  assignees: {
    orderBy: { assignedAt: "asc" as const },
    include: {
      user: { select: { id: true, name: true, profilePicture: true } },
    },
  },
};

const buildTreePath = (taskId: string, parentPath: string | null) =>
  parentPath ? `${parentPath}${taskId}/` : `/${taskId}/`;

const parseOptionalDate = (value?: string | null): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return new Date(value);
};

const applyStatusFilter = (
  where: Prisma.TaskWhereInput,
  statuses: string[]
) => {
  const includesOverdue = statuses.includes(TaskStatus.OVERDUE);
  const otherStatusParams = statuses.filter((s) => s !== TaskStatus.OVERDUE);
  const prismaOtherStatuses = prismaStatusesFromApi(otherStatusParams).filter(
    (s) => s !== TaskStatus.OVERDUE
  );

  if (!includesOverdue) {
    if (statuses.length) {
      where.status = { in: prismaStatusesFromApi(statuses) };
    }
    return;
  }

  if (prismaOtherStatuses.length === 0) {
    where.OR = buildOverdueFilterWhere().OR;
    return;
  }

  where.OR = [
    ...(buildOverdueFilterWhere().OR ?? []),
    { status: { in: prismaOtherStatuses } },
  ];
};

const buildOrderBy = (
  sortBy?: TaskSortField,
  sortOrder: "asc" | "desc" = "desc"
): Prisma.TaskOrderByWithRelationInput => {
  const direction = sortOrder;
  switch (sortBy) {
    case "title":
      return { title: direction };
    case "status":
      return { status: direction };
    case "priority":
      return { priority: direction };
    case "targetDate":
      return { targetDate: direction };
    case "startDate":
      return { startDate: direction };
    case "updatedAt":
      return { updatedAt: direction };
    case "createdAt":
    default:
      return { createdAt: direction };
  }
};

const applyStatusSideEffects = (
  updateData: Prisma.TaskUncheckedUpdateInput,
  nextStatus: TaskStatus,
  existing: { startedOn: Date | null; completedOn: Date | null }
) => {
  if (nextStatus === TaskStatus.IN_PROGRESS && !existing.startedOn) {
    updateData.startedOn = new Date();
  }
  if (nextStatus === TaskStatus.DONE && !existing.completedOn) {
    updateData.completedOn = new Date();
  }
};

export const findById = async (taskId: string, workspaceId?: string) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...(workspaceId ? { workspaceId } : {}),
      isDeleted: false,
    },
    include: taskInclude,
  });
  return task ? mapPrismaTaskToApi(task) : null;
};

export const findOneInProject = async (
  taskId: string,
  workspaceId: string,
  projectId: string
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      workspaceId,
      projectId,
      isDeleted: false,
    },
    include: taskInclude,
  });
  return task ? mapPrismaTaskToApi(task) : null;
};

export const findMany = async (
  filters: TaskFilters,
  pagination: PaginationInput
) => {
  const where: Prisma.TaskWhereInput = {
    workspaceId: filters.workspaceId,
    isDeleted: filters.includeDeleted ? undefined : false,
  };

  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.status?.length) {
    applyStatusFilter(where, filters.status);
  }
  if (filters.priority?.length) {
    where.priority = { in: prismaPrioritiesFromApi(filters.priority) };
  }
  if (filters.assignedTo?.length) {
    where.assignees = { some: { userId: { in: filters.assignedTo } } };
  }
  if (filters.keyword) {
    where.title = { contains: filters.keyword, mode: "insensitive" };
  }
  if (filters.dueDate) {
    where.targetDate = new Date(filters.dueDate);
  }
  if (filters.dueBefore || filters.dueAfter) {
    where.targetDate = {
      ...(filters.dueBefore ? { lte: new Date(filters.dueBefore) } : {}),
      ...(filters.dueAfter ? { gte: new Date(filters.dueAfter) } : {}),
    };
  }
  if (filters.parentTaskId !== undefined) {
    where.parentTaskId = filters.parentTaskId;
  }

  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;
  const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder ?? "desc");

  const [rows, totalCount] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: taskInclude,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks: rows.map(mapPrismaTaskToApi),
    totalCount,
    skip,
  };
};

export const create = async (input: TaskCreateInput) => {
  const parent = input.parentTaskId
    ? await prisma.task.findFirst({
        where: {
          id: input.parentTaskId,
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          isDeleted: false,
        },
      })
    : null;

  if (input.parentTaskId && !parent) {
    throw new Error("Parent task not found in this project");
  }

  const level = parent ? parent.level + 1 : 0;
  const prismaStatus = toPrismaTaskStatus(input.status);

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        taskCode: generateTaskCode(),
        title: input.title,
        description: input.description ?? null,
        status: prismaStatus,
        priority: toPrismaTaskPriority(input.priority),
        startDate: parseOptionalDate(input.startDate) ?? null,
        targetDate: parseOptionalDate(input.targetDate) ?? null,
        startedOn:
          parseOptionalDate(input.startedOn) ??
          (prismaStatus === TaskStatus.IN_PROGRESS ? new Date() : null),
        completedOn:
          parseOptionalDate(input.completedOn) ??
          (prismaStatus === TaskStatus.DONE ? new Date() : null),
        tags: input.tags ?? [],
        category: input.category ?? null,
        recurrence: input.recurrence
          ? (input.recurrence as Prisma.InputJsonValue)
          : undefined,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        createdById: input.createdById,
        parentTaskId: input.parentTaskId ?? null,
        level,
        treePath: "",
      },
    });

    const treePath = buildTreePath(created.id, parent?.treePath ?? null);

    await tx.task.update({
      where: { id: created.id },
      data: { treePath },
    });

    if (input.assignees?.length) {
      await taskAssigneePrisma.replaceAssignees(
        created.id,
        input.assignees,
        input.createdById,
        tx
      );
    }

    return tx.task.findUniqueOrThrow({
      where: { id: created.id },
      include: taskInclude,
    });
  });

  return mapPrismaTaskToApi(task);
};

export const update = async (taskId: string, data: TaskUpdateInput) => {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      startedOn: true,
      completedOn: true,
      status: true,
    },
  });

  if (!existing) {
    return null;
  }

  const updateData: Prisma.TaskUncheckedUpdateInput = {
    updatedById: data.updatedById,
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) {
    updateData.priority = toPrismaTaskPriority(data.priority);
  }
  if (data.status !== undefined) {
    const nextStatus = toPrismaTaskStatus(data.status);
    updateData.status = nextStatus;
    applyStatusSideEffects(updateData, nextStatus, existing);
  }
  if (data.startDate !== undefined) {
    updateData.startDate = parseOptionalDate(data.startDate) ?? null;
  }
  if (data.targetDate !== undefined) {
    updateData.targetDate = parseOptionalDate(data.targetDate) ?? null;
  }
  if (data.startedOn !== undefined) {
    updateData.startedOn = parseOptionalDate(data.startedOn) ?? null;
  }
  if (data.completedOn !== undefined) {
    updateData.completedOn = parseOptionalDate(data.completedOn) ?? null;
  }
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.recurrence !== undefined) {
    updateData.recurrence =
      data.recurrence === null
        ? Prisma.JsonNull
        : (data.recurrence as Prisma.InputJsonValue);
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: updateData,
    });

    if (data.assignees !== undefined) {
      await taskAssigneePrisma.replaceAssignees(
        taskId,
        data.assignees,
        data.updatedById,
        tx
      );
    }
  });

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });

  return task ? mapPrismaTaskToApi(task) : null;
};

export const softDelete = async (taskId: string, workspaceId: string) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId, isDeleted: false },
  });
  if (!task?.treePath) return null;

  const now = new Date();
  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: { isDeleted: true, deletedAt: now },
    }),
    prisma.task.updateMany({
      where: {
        workspaceId,
        treePath: { startsWith: task.treePath },
        isDeleted: false,
      },
      data: { isDeleted: true, deletedAt: now },
    }),
  ]);

  return task;
};

export const deleteByProject = async (projectId: string) =>
  prisma.task.updateMany({
    where: { projectId },
    data: { isDeleted: true, deletedAt: new Date() },
  });

export const deleteByWorkspace = async (workspaceId: string) =>
  prisma.task.updateMany({
    where: { workspaceId },
    data: { isDeleted: true, deletedAt: new Date() },
  });

export const count = async (where: Prisma.TaskWhereInput) =>
  prisma.task.count({ where: { ...where, isDeleted: false } });

export const countProjectAnalytics = async (
  projectId: string
): Promise<TaskAnalytics> => {
  const currentDate = new Date();
  const base = { projectId, isDeleted: false };

  const [totalTasks, overdueTasks, completedTasks] = await Promise.all([
    prisma.task.count({ where: base }),
    prisma.task.count({
      where: {
        ...base,
        ...buildOverdueFilterWhere(currentDate),
      },
    }),
    prisma.task.count({
      where: { ...base, status: TaskStatus.DONE },
    }),
  ]);

  return { totalTasks, overdueTasks, completedTasks };
};

export const countWorkspaceAnalytics = async (
  workspaceId: string
): Promise<TaskAnalytics> => {
  const currentDate = new Date();
  const base = { workspaceId, isDeleted: false };

  const [totalTasks, overdueTasks, completedTasks] = await Promise.all([
    prisma.task.count({ where: base }),
    prisma.task.count({
      where: {
        ...base,
        ...buildOverdueFilterWhere(currentDate),
      },
    }),
    prisma.task.count({
      where: { ...base, status: TaskStatus.DONE },
    }),
  ]);

  return { totalTasks, overdueTasks, completedTasks };
};

export const getChildren = async (
  parentTaskId: string,
  workspaceId: string,
  sortBy?: TaskSortField,
  sortOrder?: "asc" | "desc"
) => {
  const rows = await prisma.task.findMany({
    where: { parentTaskId, workspaceId, isDeleted: false },
    include: taskInclude,
    orderBy: buildOrderBy(sortBy, sortOrder ?? "asc"),
  });
  return rows.map(mapPrismaTaskToApi);
};

export const getSubtree = async (taskId: string, workspaceId: string) => {
  const root = await prisma.task.findFirst({
    where: { id: taskId, workspaceId, isDeleted: false },
  });
  if (!root?.treePath) return [];

  const rows = await prisma.task.findMany({
    where: {
      workspaceId,
      isDeleted: false,
      treePath: { startsWith: root.treePath },
    },
    include: taskInclude,
    orderBy: [{ level: "asc" }, { createdAt: "asc" }],
  });

  return rows.map(mapPrismaTaskToApi);
};

export const moveTask = async (
  taskId: string,
  newParentId: string | null,
  workspaceId: string,
  updatedById: string
) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId, isDeleted: false },
  });
  if (!task?.treePath) throw new Error("Task not found");

  const newParent = newParentId
    ? await prisma.task.findFirst({
        where: {
          id: newParentId,
          workspaceId,
          projectId: task.projectId,
          isDeleted: false,
        },
      })
    : null;

  if (newParentId && !newParent) throw new Error("New parent task not found");

  if (newParent?.treePath?.startsWith(task.treePath)) {
    throw new Error("Cannot move a task under its own descendant");
  }

  const oldPath = task.treePath;
  const newLevel = newParent ? newParent.level + 1 : 0;
  const newTreePath = buildTreePath(taskId, newParent?.treePath ?? null);
  const levelDelta = newLevel - task.level;

  await prisma.$transaction(async (tx) => {
    const descendants = await tx.task.findMany({
      where: {
        workspaceId,
        treePath: { startsWith: oldPath },
        NOT: { id: taskId },
        isDeleted: false,
      },
    });

    for (const descendant of descendants) {
      if (!descendant.treePath) continue;
      await tx.task.update({
        where: { id: descendant.id },
        data: {
          treePath: descendant.treePath.replace(oldPath, newTreePath),
          level: descendant.level + levelDelta,
        },
      });
    }

    await tx.task.update({
      where: { id: taskId },
      data: {
        parentTaskId: newParentId,
        treePath: newTreePath,
        level: newLevel,
        updatedById,
      },
    });
  });

  return findById(taskId, workspaceId);
};

export const updateStatus = async (
  taskId: string,
  status: string,
  updatedById: string
) => {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: { startedOn: true, completedOn: true },
  });
  if (!existing) {
    throw new Error("Task not found");
  }

  const nextStatus = toPrismaTaskStatus(status);
  const updateData: Prisma.TaskUncheckedUpdateInput = {
    status: nextStatus,
    updatedById,
  };
  applyStatusSideEffects(updateData, nextStatus, existing);

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: taskInclude,
  });
  return mapPrismaTaskToApi(task);
};
