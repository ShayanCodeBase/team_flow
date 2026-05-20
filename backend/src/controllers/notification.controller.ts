import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { notificationService } from "../services/notification.service";
import {
  listNotificationsQuerySchema,
  notificationIdSchema,
} from "../validation/notification.validation";
import { HTTPSTATUS } from "../config/http.config";
import { paginationMeta, sendSuccess } from "../utils/apiResponse";

export const listNotificationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const query = listNotificationsQuerySchema.parse(req.query);

    const { notifications, totalCount } = await notificationService.listForUser(
      userId,
      {
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
      }
    );

    return sendSuccess(res, { notifications }, HTTPSTATUS.OK, {
      ...paginationMeta({
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
        totalCount,
      }),
    });
  }
);

export const markNotificationReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const notificationId = notificationIdSchema.parse(req.params.id);

    const notification = await notificationService.markOneAsRead(
      notificationId,
      userId
    );

    return sendSuccess(res, { notification });
  }
);

export const markAllNotificationsReadController = asyncHandler(
  async (_req: Request, res: Response) => {
    const userId = _req.user?._id;

    const result = await notificationService.markAllAsRead(userId);

    return sendSuccess(res, result);
  }
);

export const getUnreadNotificationCountController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const result = await notificationService.getUnreadCount(userId);

    return sendSuccess(res, result);
  }
);
