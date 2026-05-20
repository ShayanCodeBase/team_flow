import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getWorkspaceActivitiesQueryFn } from "@/lib/api";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import {
  formatActivityRelativeTime,
  formatWorkspaceActivityDescription,
  getActivityIcon,
  getActivityIconClassName,
} from "@/lib/task-activity";
import { WorkspaceActivityType } from "@/types/api.type";
import { cn } from "@/lib/utils";

type WorkspaceActivityRowProps = {
  activity: WorkspaceActivityType;
};

function WorkspaceActivityRow({ activity }: WorkspaceActivityRowProps) {
  const userName = activity.user.name || "Unknown";
  const initials = getAvatarFallbackText(userName);
  const avatarColor = getAvatarColor(userName);
  const Icon = getActivityIcon(activity.action);
  const iconClass = getActivityIconClassName(activity.action);
  const description = formatWorkspaceActivityDescription(
    activity.action,
    activity.metadata,
    activity.task.title
  );
  const createdAt =
    typeof activity.createdAt === "string"
      ? activity.createdAt
      : new Date(activity.createdAt).toISOString();

  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          avatarColor
        )}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-medium">{userName}</span>{" "}
          <span className="text-muted-foreground">{description}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full",
            iconClass
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatActivityRelativeTime(createdAt)}
        </span>
      </div>
    </div>
  );
}

const WorkspaceRecentActivity = () => {
  const workspaceId = useWorkspaceId();

  const { data, isPending, isError } = useQuery({
    queryKey: ["workspace-activity", workspaceId],
    queryFn: () => getWorkspaceActivitiesQueryFn(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });

  const activities = data?.activities ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>
          Latest updates across tasks in this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex justify-center py-10">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive py-6 text-center">
            Could not load recent activity. Please try again.
          </p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No activity yet. Create a task or leave a comment to get started.
          </p>
        ) : (
          <div className="divide-y">
            {activities.map((activity) => (
              <WorkspaceActivityRow key={activity._id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkspaceRecentActivity;
