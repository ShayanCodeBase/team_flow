import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getAllTasksQueryFn, getWorkspaceAnalyticsQueryFn } from "@/lib/api";
import { TaskStatusEnum } from "@/constant";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import DashboardStatCard from "./common/dashboard-stat-card";
const WorkspaceAnalytics = () => {
  const workspaceId = useWorkspaceId();

  const { data, isPending } = useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: () => getWorkspaceAnalyticsQueryFn(workspaceId),
    staleTime: 0,
    enabled: !!workspaceId,
  });

  const { data: projectsData, isPending: isProjectsPending } =
    useGetProjectsInWorkspaceQuery({
      workspaceId,
      pageNumber: 1,
      pageSize: 1,
    });

  const { data: inProgressData, isPending: isInProgressPending } = useQuery({
    queryKey: ["all-tasks", workspaceId, "status", TaskStatusEnum.IN_PROGRESS],
    queryFn: () =>
      getAllTasksQueryFn({
        workspaceId,
        status: TaskStatusEnum.IN_PROGRESS,
        pageSize: 1,
        pageNumber: 1,
      }),
    enabled: !!workspaceId,
    staleTime: 0,
  });

  const analytics = data?.analytics;
  const totalTasks = analytics?.totalTasks ?? 0;
  const overdueTasks = analytics?.overdueTasks ?? 0;
  const completedTasks = analytics?.completedTasks ?? 0;
  const inProgressCount = inProgressData?.pagination.totalCount ?? 0;
  const projectCount =
    projectsData?.pagination.totalCount ?? projectsData?.projects.length ?? 0;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isStatsLoading = isPending;
  const isTotalLoading = isPending || isProjectsPending;
  const isInProgressLoading = isPending || isInProgressPending;

  const overdueTasksHref = `/workspace/${workspaceId}/tasks?status=${TaskStatusEnum.OVERDUE}`;

  return (
    <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard
        label="Total Tasks"
        value={totalTasks}
        isLoading={isTotalLoading}
        icon={CheckSquare}
        containerClassName="bg-blue-50 dark:bg-blue-950/30"
        iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
        subtitle={
          projectCount === 1
            ? "across 1 project"
            : `across ${projectCount} projects`
        }
      />

      <DashboardStatCard
        label="Overdue Tasks"
        value={overdueTasks}
        isLoading={isStatsLoading}
        icon={AlertCircle}
        containerClassName="bg-red-50 dark:bg-red-950/30"
        iconClassName="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
        valueClassName="text-red-600 dark:text-red-400"
        href={overdueTasksHref}
        showPulse
      />

      <DashboardStatCard
        label="Completed"
        value={completedTasks}
        isLoading={isStatsLoading}
        icon={CheckCircle2}
        containerClassName="bg-green-50 dark:bg-green-950/30"
        iconClassName="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
        valueClassName="text-green-600 dark:text-green-400"
        footer={
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Completion rate</span>
              <span className="font-medium text-green-700 dark:text-green-400">
                {completionRate}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-green-100 dark:bg-green-900/40">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        }
      />

      <DashboardStatCard
        label="In Progress"
        value={inProgressCount}
        isLoading={isInProgressLoading}
        icon={Clock}
        containerClassName="bg-indigo-50 dark:bg-indigo-950/30"
        iconClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
        valueClassName="text-indigo-700 dark:text-indigo-300"
      />
    </div>
    </div>
  );
};

export default WorkspaceAnalytics;
