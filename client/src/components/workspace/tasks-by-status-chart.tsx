import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TASK_STATUS_CONFIG,
  TASK_STATUS_VALUES,
  TaskStatusEnumType,
} from "@/constant";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { fetchAllWorkspaceTasks } from "@/lib/fetch-all-workspace-tasks";
import { TASK_STATUS_CHART_COLORS } from "@/lib/task-status-chart-colors";

type StatusChartDatum = {
  status: TaskStatusEnumType;
  name: string;
  value: number;
  fill: string;
};

function groupTasksByStatus(
  tasks: { status: string }[]
): Record<TaskStatusEnumType, number> {
  const counts = Object.fromEntries(
    TASK_STATUS_VALUES.map((status) => [status, 0])
  ) as Record<TaskStatusEnumType, number>;

  for (const task of tasks) {
    const status = task.status as TaskStatusEnumType;
    if (status in counts) {
      counts[status] += 1;
    }
  }

  return counts;
}

export default function TasksByStatusChart() {
  const workspaceId = useWorkspaceId();

  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ["all-tasks", workspaceId, "status-chart"],
    queryFn: () => fetchAllWorkspaceTasks(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });

  const chartData = useMemo((): StatusChartDatum[] => {
    const counts = groupTasksByStatus(tasks);
    return TASK_STATUS_VALUES.map((status) => ({
      status,
      name: TASK_STATUS_CONFIG[status].label,
      value: counts[status],
      fill: TASK_STATUS_CHART_COLORS[status],
    })).filter((entry) => entry.value > 0);
  }, [tasks]);

  const totalTasks = tasks.length;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Tasks by status</CardTitle>
        <CardDescription>
          Distribution of all workspace tasks across statuses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex h-[280px] items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive py-12 text-center">
            Could not load status breakdown.
          </p>
        )}

        {!isLoading && !isError && totalTasks === 0 && (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No tasks yet. Create tasks to see the breakdown.
          </p>
        )}

        {!isLoading && !isError && totalTasks > 0 && chartData.length === 0 && (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No status data available.
          </p>
        )}

        {!isLoading && !isError && chartData.length > 0 && (
          <div className="h-[300px] w-full min-w-0 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="52%"
                  outerRadius="78%"
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => {
                    const count =
                      typeof value === "number" ? value : Number(value ?? 0);
                    const payload = item.payload as StatusChartDatum;
                    const pct =
                      totalTasks > 0
                        ? Math.round((count / totalTasks) * 100)
                        : 0;
                    return [`${count} (${pct}%)`, payload.name];
                  }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
