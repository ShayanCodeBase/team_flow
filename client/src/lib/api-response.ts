import { PaginationType } from "@/types/api.type";

export type ApiPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: ApiPaginationMeta;
};

export type ApiErrorEnvelope = {
  success: false;
  message: string;
  errors?: Record<string, string>;
  errorCode?: string;
};

export const unwrapApiData = <T>(body: ApiSuccessEnvelope<T>): T => body.data;

export const unwrapApiDataWithMeta = <T>(body: ApiSuccessEnvelope<T>) => ({
  data: body.data,
  meta: body.meta,
});

export const metaToPagination = (
  meta: ApiPaginationMeta
): PaginationType => ({
  pageNumber: meta.page,
  pageSize: meta.pageSize,
  totalCount: meta.total,
  totalPages: meta.totalPages,
  skip: (meta.page - 1) * meta.pageSize,
  limit: meta.pageSize,
});
