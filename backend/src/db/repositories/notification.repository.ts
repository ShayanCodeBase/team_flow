import * as notificationRepo from "./implementations/prisma/notification.prisma";

export type { NotificationCreateInput } from "./implementations/prisma/notification.prisma";

export const notificationRepository = {
  create: notificationRepo.create,
  findManyByUserId: notificationRepo.findManyByUserId,
  markAsRead: notificationRepo.markAsRead,
  markAllAsRead: notificationRepo.markAllAsRead,
  countUnread: notificationRepo.countUnread,
};
