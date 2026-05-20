import { useMemo, useState } from "react";
import { endOfDay, startOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  TaskPriorityEnum,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getAllTasksQueryFn } from "@/lib/api";
import { TaskType } from "@/types/api.type";
import EditTaskDialog from "./edit-task-dialog";

const ACTIVE_STATUSES = new Set<string>([
  TaskStatusEnum.PENDING,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.OVERDUE,
  TaskStatusEnum.ON_HOLD,
  TaskStatusEnum.CRITICAL,
]);

const TasksDueToday = () => {
  const workspaceId = useWorkspaceId();
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { dueAfter, dueBefore } = useMemo(() => {
    const now = new Date();
    return {
      dueAfter: startOfDay(now).toISOString(),
      dueBefore: endOfDay(now).toISOString(),
    };
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasks-due-today", workspaceId, dueAfter, dueBefore],
    queryFn: () =>
      getAllTasksQueryFn({
        workspaceId,
        dueAfter,
        dueBefore,
        pageSize: 100,
        pageNumber: 1,
        sortBy: "targetDate",
        sortOrder: "asc",
      }),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });

  const tasksDueToday = useMemo(
    () =>
      (data?.tasks ?? []).filter((task) =>
        ACTIVE_STATUSES.has(task.status)
      ),
    [data?.tasks]
  );

  const handleOpenTask = (task: TaskType) => {
    setSelectedTask(task);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setSelectedTask(null);
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Tasks due today
            {!isLoading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({tasksDueToday.length})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Open tasks with a target date of today across this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <p className="text-sm text-destructive py-6 text-center">
              Could not load tasks due today.
            </p>
          )}

          {!isLoading && !isError && tasksDueToday.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No tasks due today — you&apos;re all caught up for now.
            </p>
          )}

          {!isLoading && !isError && tasksDueToday.length > 0 && (
            <ul className="divide-y divide-border rounded-md border">
              {tasksDueToday.map((task) => {
                const statusKey = task.status as TaskStatusEnumType;
                const statusConfig = TASK_STATUS_CONFIG[statusKey];

                return (
                  <li key={task._id}>
                    <button
                      type="button"
                      onClick={() => handleOpenTask(task)}
                      className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-medium leading-snug truncate">
                          {task.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {task.project?.emoji && (
                            <span className="mr-1">{task.project.emoji}</span>
                          )}
                          {task.project?.name ?? "Unknown project"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant={TaskPriorityEnum[task.priority]}
                          className="uppercase border-0 shadow-sm"
                        >
                          {TASK_PRIORITY_CONFIG[task.priority].label}
                        </Badge>
                        <Badge
                          variant={TaskStatusEnum[statusKey]}
                          className="uppercase border-0 shadow-sm"
                        >
                          <span
                            className={
                              statusConfig?.strikethrough ? "line-through" : ""
                            }
                          >
                            {statusConfig?.label ?? task.status}
                          </span>
                        </Badge>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {selectedTask && (
        <EditTaskDialog
          task={selectedTask}
          isOpen={editOpen}
          onClose={handleCloseEdit}
        />
      )}
    </>
  );
};

export default TasksDueToday;
