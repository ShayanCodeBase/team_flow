import { Prisma } from "@prisma/client";
import prisma from "../../../prisma/client";
import { pickUserPublic } from "../../../mappers/document.mapper";
import { TaskActivityActionType } from "../../../../enums/task-activity.enum";

export type TaskActivityCreateInput = {
  taskId: string;
  userId: string;
  action: TaskActivityActionType;
  metadata?: Record<string, unknown>;
};

const mapActivity = (activity: {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  user: { id: string; name: string | null; profilePicture: string | null };
}) => ({
  _id: activity.id,
  taskId: activity.taskId,
  action: activity.action,
  metadata: activity.metadata,
  createdAt: activity.createdAt,
  user: pickUserPublic(activity.user),
});

export type WorkspaceActivityApiDto = ReturnType<typeof mapActivity> & {
  task: { _id: string; title: string };
};

const mapWorkspaceActivity = (activity: {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  user: { id: string; name: string | null; profilePicture: string | null };
  task: { id: string; title: string };
}): WorkspaceActivityApiDto => ({
  ...mapActivity(activity),
  task: { _id: activity.task.id, title: activity.task.title },
});

export const create = async (data: TaskActivityCreateInput) => {
  const activity = await prisma.taskActivity.create({
    data: {
      taskId: data.taskId,
      userId: data.userId,
      action: data.action,
      metadata: data.metadata
        ? (data.metadata as Prisma.InputJsonValue)
        : undefined,
    },
    include: {
      user: { select: { id: true, name: true, profilePicture: true } },
    },
  });

  return mapActivity(activity);
};

export const findManyByTaskId = async (
  taskId: string,
  pageNumber: number,
  pageSize: number
) => {
  const skip = (pageNumber - 1) * pageSize;
  const where = { taskId };

  const [activities, totalCount] = await Promise.all([
    prisma.taskActivity.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, profilePicture: true } },
      },
    }),
    prisma.taskActivity.count({ where }),
  ]);

  return {
    activities: activities.map(mapActivity),
    totalCount,
  };
};

export const findRecentByWorkspaceId = async (
  workspaceId: string,
  limit: number = 20
): Promise<WorkspaceActivityApiDto[]> => {
  const activities = await prisma.taskActivity.findMany({
    where: {
      task: {
        workspaceId,
        isDeleted: false,
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, profilePicture: true } },
      task: { select: { id: true, title: true } },
    },
  });

  return activities.map(mapWorkspaceActivity);
};
