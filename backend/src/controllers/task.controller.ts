import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  createSubtaskSchema,
  createTaskSchema,
  moveTaskSchema,
  taskIdSchema,
  taskListQuerySchema,
  updateTaskSchema,
} from "../validation/task.validation";
import { projectIdSchema } from "../validation/project.validation";
import { workspaceIdSchema } from "../validation/workspace.validation";
import { Permissions } from "../enums/role.enum";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import {
  createSubtaskService,
  createTaskService,
  deleteTaskService,
  getAllTasksService,
  getTaskByIdService,
  getTaskChildrenService,
  getTaskSubtreeService,
  moveTaskService,
  updateTaskService,
} from "../services/task.service";
import { HTTPSTATUS } from "../config/http.config";
import { paginationMeta, sendSuccess } from "../utils/apiResponse";
import { TaskSortField } from "../db/repositories/types";

export const createTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const body = createTaskSchema.parse(req.body);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_TASK]);

    const { task } = await createTaskService(
      workspaceId,
      projectId,
      userId,
      body
    );

    return sendSuccess(res, { task }, HTTPSTATUS.CREATED);
  }
);

export const createSubtaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const body = createSubtaskSchema.parse(req.body);
    const parentTaskId = taskIdSchema.parse(req.params.parentTaskId);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_TASK]);

    const { task } = await createSubtaskService(
      workspaceId,
      projectId,
      parentTaskId,
      userId,
      body
    );

    return sendSuccess(res, { task }, HTTPSTATUS.CREATED);
  }
);

export const updateTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const body = updateTaskSchema.parse(req.body);

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { updatedTask } = await updateTaskService(
      workspaceId,
      projectId,
      taskId,
      userId,
      body
    );

    return sendSuccess(res, { task: updatedTask });
  }
);

export const getAllTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const query = taskListQuerySchema.parse(req.query);

    const filters = {
      projectId: query.projectId,
      status: query.status ? query.status.split(",") : undefined,
      priority: query.priority ? query.priority.split(",") : undefined,
      assignedTo: query.assignedTo
        ? query.assignedTo.split(",")
        : undefined,
      keyword: query.keyword,
      dueDate: query.dueDate,
      dueBefore: query.dueBefore,
      dueAfter: query.dueAfter,
      rootOnly: query.rootOnly === "true",
      sortBy: query.sortBy as TaskSortField | undefined,
      sortOrder: query.sortOrder,
    };

    const pageSize = query.pageSize ?? 10;
    const pageNumber = query.pageNumber ?? 1;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await getAllTasksService(
      workspaceId,
      filters,
      { pageSize, pageNumber }
    );

    return sendSuccess(
      res,
      { tasks: result.tasks },
      HTTPSTATUS.OK,
      paginationMeta({
        pageNumber,
        pageSize,
        totalCount: result.pagination.totalCount,
      })
    );
  }
);

export const getTaskByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const task = await getTaskByIdService(workspaceId, projectId, taskId);

    return sendSuccess(res, { task });
  }
);

export const getTaskChildrenController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await getTaskChildrenService(
      workspaceId,
      projectId,
      taskId
    );

    return sendSuccess(res, result);
  }
);

export const getTaskSubtreeController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await getTaskSubtreeService(
      workspaceId,
      projectId,
      taskId
    );

    return sendSuccess(res, result);
  }
);

export const moveTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const { newParentId } = moveTaskSchema.parse(req.body);
    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_TASK]);

    const { task } = await moveTaskService(
      workspaceId,
      projectId,
      taskId,
      newParentId,
      userId
    );

    return sendSuccess(res, { task });
  }
);

export const deleteTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_TASK]);

    await deleteTaskService(workspaceId, taskId, userId);

    return sendSuccess(res, { deleted: true });
  }
);
