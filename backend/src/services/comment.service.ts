import {
  commentRepository,
  taskRepository,
  userRepository,
} from "../db/repositories";
import { NotificationType } from "../enums/notification-type.enum";
import { TaskActivityAction } from "../enums/task-activity.enum";
import { NotFoundException } from "../utils/appError";
import { logActivity } from "./task-activity.service";
import { notificationService } from "./notification.service";

export const createCommentService = async (data: {
  taskId: string;
  workspaceId: string;
  authorId: string;
  content: string;
}) => {
  const task = await taskRepository.findById(data.taskId, data.workspaceId);
  if (!task) {
    throw new NotFoundException("Task not found");
  }

  const comment = await commentRepository.create({
    taskId: data.taskId,
    authorId: data.authorId,
    content: data.content,
  });

  await logActivity({
    taskId: data.taskId,
    userId: data.authorId,
    action: TaskActivityAction.COMMENT_ADDED,
  });

  const author = await userRepository.findById(data.authorId);
  const authorName = author?.name ?? "Someone";

  await Promise.all(
    task.assignees
      .filter((assignee) => assignee._id !== data.authorId)
      .map((assignee) =>
        notificationService.createAndSend(
          assignee._id,
          NotificationType.COMMENT_ADDED,
          "New comment on your task",
          `${authorName} commented on ${task.title}`,
          {
            taskId: data.taskId,
            workspaceId: data.workspaceId,
            commentId: comment._id,
          }
        )
      )
  );

  return { comment };
};

export const listCommentsByTaskService = async (
  taskId: string,
  workspaceId: string,
  pagination: { pageNumber: number; pageSize: number }
) => {
  const task = await taskRepository.findById(taskId, workspaceId);
  if (!task) {
    throw new NotFoundException("Task not found");
  }

  const { comments, totalCount } = await commentRepository.findManyPaginated(
    taskId,
    pagination
  );

  return { comments, totalCount };
};

export const updateCommentService = async (
  commentId: string,
  authorId: string,
  content: string
) => {
  const existing = await commentRepository.findById(commentId);
  if (!existing) {
    throw new NotFoundException("Comment not found or not authorized");
  }

  const comment = await commentRepository.update(commentId, authorId, content);
  if (!comment) {
    throw new NotFoundException("Comment not found or not authorized");
  }

  await logActivity({
    taskId: existing.taskId,
    userId: authorId,
    action: TaskActivityAction.COMMENT_UPDATED,
  });

  return { comment };
};

export const deleteCommentService = async (
  commentId: string,
  authorId: string
) => {
  const existing = await commentRepository.findById(commentId);
  if (!existing) {
    throw new NotFoundException("Comment not found or not authorized");
  }

  const deleted = await commentRepository.delete(commentId, authorId);
  if (!deleted) {
    throw new NotFoundException("Comment not found or not authorized");
  }

  await logActivity({
    taskId: existing.taskId,
    userId: authorId,
    action: TaskActivityAction.COMMENT_DELETED,
  });
};
