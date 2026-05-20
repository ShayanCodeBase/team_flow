import { getAllTasksQueryFn } from "@/lib/api";
import { AllTaskPayloadType, TaskType } from "@/types/api.type";

const MAX_PAGE_SIZE = 100;

export type FetchAllWorkspaceTasksParams = Omit<
  AllTaskPayloadType,
  "pageNumber" | "pageSize"
>;

/**
 * Fetches every task page for a workspace in parallel (first page + meta, then Promise.all).
 */
export async function fetchAllWorkspaceTasks(
  workspaceIdOrParams: string | FetchAllWorkspaceTasksParams
): Promise<TaskType[]> {
  const baseParams: FetchAllWorkspaceTasksParams =
    typeof workspaceIdOrParams === "string"
      ? { workspaceId: workspaceIdOrParams }
      : workspaceIdOrParams;

  const firstPage = await getAllTasksQueryFn({
    ...baseParams,
    pageSize: MAX_PAGE_SIZE,
    pageNumber: 1,
  });

  const { totalPages } = firstPage.pagination;
  if (totalPages <= 1) {
    return firstPage.tasks;
  }

  const otherPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getAllTasksQueryFn({
        ...baseParams,
        pageSize: MAX_PAGE_SIZE,
        pageNumber: index + 2,
      })
    )
  );

  return [firstPage.tasks, ...otherPages.map((page) => page.tasks)].flat();
}
