import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Permissions } from "../enums/role.enum";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import {
  listTaskActivitiesService,
  listWorkspaceActivitiesService,
} from "../services/task-activity.service";
import { workspaceIdSchema } from "../validation/workspace.validation";
import { taskIdSchema } from "../validation/task.validation";
import { listTaskActivitiesQuerySchema } from "../validation/task-activity.validation";
import { HTTPSTATUS } from "../config/http.config";
import { paginationMeta, sendSuccess } from "../utils/apiResponse";

export const listTaskActivitiesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const taskId = taskIdSchema.parse(req.params.taskId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const query = listTaskActivitiesQuerySchema.parse(req.query);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { activities, totalCount } = await listTaskActivitiesService(
      taskId,
      workspaceId,
      {
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      }
    );

    return sendSuccess(res, { activities }, HTTPSTATUS.OK, {
      ...paginationMeta({
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
        totalCount,
      }),
    });
  }
);

export const listWorkspaceActivitiesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { activities } = await listWorkspaceActivitiesService(workspaceId);

    return sendSuccess(res, { activities });
  }
);
