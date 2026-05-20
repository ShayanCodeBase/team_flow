import { Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TASK_PRIORITY_CONFIG,
  TaskPriorityEnumType,
} from "@/constant";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { cn } from "@/lib/utils";
import { TaskType } from "@/types/api.type";
import { hasRecurrence } from "@/lib/recurrence";
import { isTaskTargetDateOverdue } from "./kanban-utils";

type KanbanTaskCardProps = {
  task: TaskType;
  index: number;
  onOpen: (task: TaskType) => void;
};

export default function KanbanTaskCard({
  task,
  index,
  onOpen,
}: KanbanTaskCardProps) {
  const priorityKey = task.priority as TaskPriorityEnumType;
  const priorityConfig = TASK_PRIORITY_CONFIG[priorityKey];
  const overdue = isTaskTargetDateOverdue(task);
  const projectName = task.project?.name;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "cursor-grab border shadow-sm transition-all duration-200 ease-in-out active:cursor-grabbing",
            snapshot.isDragging &&
              "rotate-1 shadow-xl ring-2 ring-primary/20 z-50"
          )}
          onClick={() => onOpen(task)}
        >
          <CardContent className="p-3 space-y-2.5">
            <div className="flex items-start gap-1.5">
              {hasRecurrence(task.recurrence) && (
                <Repeat
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5"
                  aria-label="Recurring task"
                />
              )}
              <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">
                {task.title}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant={priorityKey}
                className="text-[10px] px-1.5 py-0 h-5 font-medium border-0 shadow-none"
              >
                {priorityConfig.label}
              </Badge>
            </div>

            {task.assignees.length > 0 && (
              <div className="flex items-center -space-x-1.5">
                {task.assignees.slice(0, 4).map((assignee) => {
                  const name = assignee.name || "?";
                  const initials = getAvatarFallbackText(name);
                  return (
                    <div
                      key={assignee._id}
                      title={name}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[10px] font-medium",
                        getAvatarColor(name)
                      )}
                    >
                      {initials}
                    </div>
                  );
                })}
                {task.assignees.length > 4 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-medium text-muted-foreground">
                    +{task.assignees.length - 4}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end justify-between gap-2 pt-0.5">
              {task.targetDate ? (
                <span
                  className={cn(
                    "text-xs",
                    overdue
                      ? "text-red-600 font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {format(new Date(task.targetDate), "MMM d, yyyy")}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No due date</span>
              )}
              {projectName && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[100px] text-right">
                  {task.project?.emoji} {projectName}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}
