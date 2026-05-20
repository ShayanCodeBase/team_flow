import { Server } from "socket.io";
import { notificationRepository } from "../db/repositories";
import { NotificationTypeValue } from "../enums/notification-type.enum";
import { NotFoundException } from "../utils/appError";

const NEW_NOTIFICATION_EVENT = "new_notification";

class NotificationServiceSingleton {
  private io: Server | null = null;

  init(io: Server): void {
    this.io = io;
  }

  getIO(): Server {
    if (!this.io) {
      throw new Error("Socket.io has not been initialized on NotificationService");
    }
    return this.io;
  }

  notifyUser(userId: string, event: string, data: object): void {
    if (!this.io) {
      return;
    }
    this.io.to(userId).emit(event, data);
  }

  notifyWorkspace(workspaceId: string, event: string, data: object): void {
    if (!this.io) {
      return;
    }
    this.io.to(workspaceId).emit(event, data);
  }

  async createAndSend(
    userId: string,
    type: NotificationTypeValue,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ) {
    const notification = await notificationRepository.create({
      userId,
      type,
      title,
      message,
      metadata,
    });

    this.notifyUser(userId, NEW_NOTIFICATION_EVENT, notification);

    return notification;
  }

  async listForUser(
    userId: string,
    pagination: { pageNumber: number; pageSize: number }
  ) {
    const { pageNumber, pageSize } = pagination;
    return notificationRepository.findManyByUserId(
      userId,
      pageNumber,
      pageSize
    );
  }

  async markOneAsRead(notificationId: string, userId: string) {
    const notification = await notificationRepository.markAsRead(
      notificationId,
      userId
    );
    if (!notification) {
      throw new NotFoundException("Notification not found");
    }
    return notification;
  }

  async markAllAsRead(userId: string) {
    const count = await notificationRepository.markAllAsRead(userId);
    return { count };
  }

  async getUnreadCount(userId: string) {
    const count = await notificationRepository.countUnread(userId);
    return { count };
  }
}

export const notificationService = new NotificationServiceSingleton();
