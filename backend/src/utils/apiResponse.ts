import { Response } from "express";
import { HTTPSTATUS } from "../config/http.config";

export type ApiPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: ApiPaginationMeta;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: Record<string, string>;
  errorCode?: string;
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = HTTPSTATUS.OK,
  meta?: ApiPaginationMeta
): Response => {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (meta) {
    body.meta = meta;
  }
  return res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = HTTPSTATUS.BAD_REQUEST,
  errors?: Record<string, string>,
  errorCode?: string
): Response => {
  const body: ApiErrorResponse = { success: false, message };
  if (errors && Object.keys(errors).length > 0) {
    body.errors = errors;
  }
  if (errorCode) {
    body.errorCode = errorCode;
  }
  return res.status(statusCode).json(body);
};

export const zodErrorsToFieldMap = (
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path.join(".") || "_root";
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
};

export const paginationMeta = (input: {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}): ApiPaginationMeta => ({
  page: input.pageNumber,
  pageSize: input.pageSize,
  total: input.totalCount,
  totalPages: Math.ceil(input.totalCount / input.pageSize) || 0,
});
