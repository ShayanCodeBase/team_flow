import { Prisma } from "@prisma/client";
import prisma from "../../../prisma/client";
import { NotificationTypeValue } from "../../../../enums/notification-type.enum";

export type NotificationCreateInput = {
  userId: string;
  type: NotificationTypeValue;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

const mapNotification = (notification: {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}) => ({
  _id: notification.id,
  userId: notification.userId,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  isRead: notification.isRead,
  metadata: notification.metadata,
  createdAt: notification.createdAt,
});

export const create = async (data: NotificationCreateInput) => {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata
        ? (data.metadata as Prisma.InputJsonValue)
        : undefined,
    },
  });

  return mapNotification(notification);
};

export const findManyByUserId = async (
  userId: string,
  pageNumber: number,
  pageSize: number
) => {
  const skip = (pageNumber - 1) * pageSize;
  const where = { userId };

  const [notifications, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications: notifications.map(mapNotification),
    totalCount,
  };
};

export const markAsRead = async (id: string, userId: string) => {
  const existing = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return null;
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return mapNotification(notification);
};

export const markAllAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return result.count;
};

export const countUnread = async (userId: string) =>
  prisma.notification.count({
    where: { userId, isRead: false },
  });
