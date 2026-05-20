import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import { NotificationType } from "@/types/api.type";

export const NEW_NOTIFICATION_EVENT = "new_notification";

const toIsoString = (value: NotificationType["createdAt"]): string => {
  if (typeof value === "string") return value;
  return new Date(value as string | number).toISOString();
};

export const normalizeNotification = (
  payload: NotificationType
): NotificationType => ({
  ...payload,
  isRead: payload.isRead ?? false,
  createdAt: toIsoString(payload.createdAt),
});

/**
 * Subscribes to `new_notification` once the socket exists and is connected.
 * Handles the race where NotificationBell mounts before connect() finishes.
 */
export const useNotificationSocket = (
  onNotification: (notification: NotificationType) => void
): void => {
  useEffect(() => {
    let socket: Socket | null = null;
    let handler: ((payload: NotificationType) => void) | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const detach = () => {
      if (socket && handler) {
        socket.off(NEW_NOTIFICATION_EVENT, handler);
      }
      socket = null;
      handler = null;
    };

    const attach = (activeSocket: Socket) => {
      detach();
      socket = activeSocket;
      handler = (payload: NotificationType) => {
        onNotification(normalizeNotification(payload));
      };
      socket.on(NEW_NOTIFICATION_EVENT, handler);
    };

    const tryAttach = (): boolean => {
      const activeSocket = getSocket();
      if (!activeSocket) return false;

      if (activeSocket.connected) {
        attach(activeSocket);
        return true;
      }

      const onConnect = () => {
        attach(activeSocket);
      };
      activeSocket.once("connect", onConnect);
      return true;
    };

    if (!tryAttach()) {
      pollId = setInterval(() => {
        if (tryAttach() && pollId) {
          clearInterval(pollId);
          pollId = null;
        }
      }, 250);
    }

    return () => {
      if (pollId) clearInterval(pollId);
      detach();
    };
  }, [onNotification]);
};
