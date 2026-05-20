import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTaskActivities } from "@/lib/api";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import {
  formatActivityDescription,
  formatActivityRelativeTime,
  getActivityIcon,
  getActivityIconClassName,
} from "@/lib/task-activity";
import { TaskActivityType } from "@/types/api.type";
import { cn } from "@/lib/utils";

type TaskActivityThreadProps = {
  taskId: string;
  workspaceId: string;
};

const ACTIVITIES_PAGE_SIZE = 20;

const activitiesQueryKey = (
  workspaceId: string,
  taskId: string,
  page: number
) => ["task-activities", workspaceId, taskId, page] as const;

type ActivityRowProps = {
  activity: TaskActivityType;
};

function ActivityRow({ activity }: ActivityRowProps) {
  const userName = activity.user.name || "Unknown";
  const initials = getAvatarFallbackText(userName);
  const avatarColor = getAvatarColor(userName);
  const Icon = getActivityIcon(activity.action);
  const iconClass = getActivityIconClassName(activity.action);
  const description = formatActivityDescription(
    activity.action,
    activity.metadata
  );

  return (
    <div className="flex gap-3 py-3">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          avatarColor
        )}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm leading-snug">
          <span className="font-medium">{userName}</span>{" "}
          <span className="text-muted-foreground">{description}</span>
        </p>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full",
              iconClass
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs text-muted-foreground">
            {formatActivityRelativeTime(activity.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TaskActivityThread({
  taskId,
  workspaceId,
}: TaskActivityThreadProps) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TaskActivityType[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
    setItems([]);
    setTotalPages(1);
  }, [taskId, workspaceId]);

  const { isLoading, isFetching } = useQuery({
    queryKey: activitiesQueryKey(workspaceId, taskId, page),
    queryFn: async () => {
      const result = await getTaskActivities(
        taskId,
        workspaceId,
        page,
        ACTIVITIES_PAGE_SIZE
      );
      setTotalPages(result.pagination.totalPages);
      setItems((prev) =>
        page === 1 ? result.activities : [...prev, ...result.activities]
      );
      return result;
    },
    staleTime: 0,
  });

  const hasMore = page < totalPages;
  const showInitialLoader = isLoading && items.length === 0;

  return (
    <div className="space-y-1">
      {showInitialLoader ? (
        <div className="flex justify-center py-8">
          <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No activity yet.
        </p>
      ) : (
        <div className="divide-y">
          {items.map((activity) => (
            <ActivityRow key={activity._id} activity={activity} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="pt-2 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            {isFetching ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin mr-1" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
