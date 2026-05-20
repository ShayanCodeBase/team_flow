import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Permissions } from "../enums/role.enum";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import {
  createCommentService,
  deleteCommentService,
  listCommentsByTaskService,
  updateCommentService,
} from "../services/comment.service";
import { workspaceIdSchema } from "../validation/workspace.validation";
import { taskIdSchema } from "../validation/task.validation";
import {
  commentIdSchema,
  createCommentSchema,
  listCommentsQuerySchema,
  updateCommentSchema,
} from "../validation/comment.validation";
import { HTTPSTATUS } from "../config/http.config";
import { paginationMeta, sendSuccess } from "../utils/apiResponse";

export const listCommentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const taskId = taskIdSchema.parse(req.params.taskId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const query = listCommentsQuerySchema.parse(req.query);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { comments, totalCount } = await listCommentsByTaskService(
      taskId,
      workspaceId,
      {
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      }
    );

    return sendSuccess(res, { comments }, HTTPSTATUS.OK, {
      ...paginationMeta({
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
        totalCount,
      }),
    });
  }
);

export const createCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const taskId = taskIdSchema.parse(req.params.taskId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const body = createCommentSchema.parse(req.body);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { comment } = await createCommentService({
      taskId,
      workspaceId,
      authorId: userId,
      content: body.content,
    });

    return sendSuccess(res, { comment }, HTTPSTATUS.CREATED);
  }
);

export const updateCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const commentId = commentIdSchema.parse(req.params.id);
    const body = updateCommentSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { comment } = await updateCommentService(
      commentId,
      userId,
      body.content
    );

    return sendSuccess(res, { comment });
  }
);

export const deleteCommentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const commentId = commentIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    await deleteCommentService(commentId, userId);

    return sendSuccess(res, { deleted: true });
  }
);
