export const NotificationType = {
  TASK_ASSIGNED: "TASK_ASSIGNED",
  COMMENT_ADDED: "COMMENT_ADDED",
  TASK_OVERDUE: "TASK_OVERDUE",
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];
