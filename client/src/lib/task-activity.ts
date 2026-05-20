import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Flag,
  MessageSquare,
  Move,
  PlusCircle,
  Repeat,
  Trash2,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  NotificationType,
  TaskActivityActionType,
  TaskActivityType,
} from "@/types/api.type";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const metadataString = (
  metadata: Record<string, unknown> | null,
  key: string
): string | undefined => {
  if (!metadata) return undefined;
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
};

export const formatActivityRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const secondsAgo = (Date.now() - date.getTime()) / 1000;
  if (secondsAgo < 60) return "just now";
  return formatDistanceToNow(date, { addSuffix: true });
};

export const getActivityIcon = (
  action: TaskActivityType["action"]
): LucideIcon => {
  switch (action) {
    case "TASK_CREATED":
      return PlusCircle;
    case "STATUS_CHANGED":
      return Repeat;
    case "PRIORITY_CHANGED":
      return Flag;
    case "ASSIGNEE_ADDED":
      return UserPlus;
    case "ASSIGNEE_REMOVED":
      return UserMinus;
    case "COMMENT_ADDED":
    case "COMMENT_UPDATED":
    case "COMMENT_DELETED":
      return MessageSquare;
    case "DUE_DATE_CHANGED":
      return Calendar;
    case "TASK_MOVED":
      return Move;
    case "TASK_DELETED":
      return Trash2;
    default:
      return PlusCircle;
  }
};

export const getActivityIconClassName = (
  action: TaskActivityType["action"]
): string => {
  switch (action) {
    case "TASK_CREATED":
      return "text-emerald-600 bg-emerald-50";
    case "STATUS_CHANGED":
      return "text-blue-600 bg-blue-50";
    case "PRIORITY_CHANGED":
      return "text-amber-600 bg-amber-50";
    case "ASSIGNEE_ADDED":
      return "text-violet-600 bg-violet-50";
    case "ASSIGNEE_REMOVED":
      return "text-rose-600 bg-rose-50";
    case "COMMENT_ADDED":
    case "COMMENT_UPDATED":
    case "COMMENT_DELETED":
      return "text-sky-600 bg-sky-50";
    case "DUE_DATE_CHANGED":
      return "text-orange-600 bg-orange-50";
    case "TASK_MOVED":
      return "text-indigo-600 bg-indigo-50";
    case "TASK_DELETED":
      return "text-rose-600 bg-rose-50";
    default:
      return "text-muted-foreground bg-muted";
  }
};

export const formatActivityDescription = (
  action: TaskActivityActionType | string,
  metadata: Record<string, unknown> | null
): string => {
  const meta = isRecord(metadata) ? metadata : null;

  switch (action) {
    case "TASK_CREATED":
      return "created this task";
    case "TASK_UPDATED": {
      const field = metadataString(meta, "field");
      if (field === "title") return "updated the title";
      if (field === "description") return "updated the description";
      return "updated this task";
    }
    case "STATUS_CHANGED": {
      const from = metadataString(meta, "from") ?? "—";
      const to = metadataString(meta, "to") ?? "—";
      return `changed status from ${from} to ${to}`;
    }
    case "PRIORITY_CHANGED": {
      const from = metadataString(meta, "from") ?? "—";
      const to = metadataString(meta, "to") ?? "—";
      return `changed priority from ${from} to ${to}`;
    }
    case "ASSIGNEE_ADDED": {
      const userName = metadataString(meta, "userName") ?? "someone";
      return `assigned ${userName}`;
    }
    case "ASSIGNEE_REMOVED": {
      const userName = metadataString(meta, "userName") ?? "someone";
      return `removed ${userName}`;
    }
    case "COMMENT_ADDED":
      return "added a comment";
    case "COMMENT_UPDATED":
      return "updated a comment";
    case "COMMENT_DELETED":
      return "deleted a comment";
    case "DUE_DATE_CHANGED":
      return "changed due date";
    case "TASK_MOVED":
      return "moved this task";
    case "TASK_DELETED":
      return "deleted this task";
    default:
      return "performed an action";
  }
};

export const formatWorkspaceActivityDescription = (
  action: TaskActivityActionType | string,
  metadata: Record<string, unknown> | null,
  taskTitle: string
): string => {
  const description = formatActivityDescription(action, metadata);
  const meta = isRecord(metadata) ? metadata : null;

  switch (action) {
    case "TASK_CREATED":
      return `created ${taskTitle}`;
    case "TASK_DELETED":
      return `deleted ${taskTitle}`;
    case "STATUS_CHANGED": {
      const from = metadataString(meta, "from") ?? "—";
      const to = metadataString(meta, "to") ?? "—";
      return `changed status of ${taskTitle} from ${from} to ${to}`;
    }
    case "PRIORITY_CHANGED": {
      const from = metadataString(meta, "from") ?? "—";
      const to = metadataString(meta, "to") ?? "—";
      return `changed priority of ${taskTitle} from ${from} to ${to}`;
    }
    case "TASK_UPDATED": {
      if (description.includes("title")) {
        return `updated the title of ${taskTitle}`;
      }
      if (description.includes("description")) {
        return `updated the description of ${taskTitle}`;
      }
      return `updated ${taskTitle}`;
    }
    case "ASSIGNEE_ADDED":
      return `${description} to ${taskTitle}`;
    case "ASSIGNEE_REMOVED":
      return `${description} from ${taskTitle}`;
    case "COMMENT_ADDED":
    case "COMMENT_UPDATED":
    case "COMMENT_DELETED":
      return `${description} on ${taskTitle}`;
    case "DUE_DATE_CHANGED":
      return `changed due date of ${taskTitle}`;
    case "TASK_MOVED":
      return `moved ${taskTitle}`;
    default:
      return `${description} on ${taskTitle}`;
  }
};

export const parseNotificationMetadata = (
  metadata: NotificationType["metadata"]
): { taskId?: string; workspaceId?: string; commentId?: string } => {
  if (!isRecord(metadata)) {
    return {};
  }
  return {
    taskId:
      typeof metadata.taskId === "string" ? metadata.taskId : undefined,
    workspaceId:
      typeof metadata.workspaceId === "string"
        ? metadata.workspaceId
        : undefined,
    commentId:
      typeof metadata.commentId === "string" ? metadata.commentId : undefined,
  };
};
