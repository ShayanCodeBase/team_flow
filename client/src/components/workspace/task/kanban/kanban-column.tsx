import { Droppable } from "@hello-pangea/dnd";
import { TaskStatusEnumType } from "@/constant";
import { TaskType } from "@/types/api.type";
import { cn } from "@/lib/utils";
import {
  getStatusLabel,
  STATUS_DOT_CLASS,
} from "./kanban-constants";
import KanbanTaskCard from "./kanban-task-card";

type KanbanColumnProps = {
  status: TaskStatusEnumType;
  tasks: TaskType[];
  onOpenTask: (task: TaskType) => void;
};

export default function KanbanColumn({
  status,
  tasks,
  onOpenTask,
}: KanbanColumnProps) {
  return (
    <div className="flex w-72 shrink-0 flex-col h-full min-h-[400px] max-h-full rounded-xl border bg-muted/30">
      <div className="flex items-center gap-2 border-b bg-card/80 px-3 py-2.5 rounded-t-xl shrink-0">
        <span
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            STATUS_DOT_CLASS[status]
          )}
          aria-hidden
        />
        <h3 className="text-sm font-semibold truncate flex-1">
          {getStatusLabel(status)}
        </h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex min-h-[120px] max-h-[calc(100vh-200px)] flex-1 flex-col gap-2 overflow-y-auto p-2 transition-all duration-200 ease-in-out",
              snapshot.isDraggingOver &&
                "border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg"
            )}
          >
            {tasks.map((task, index) => (
              <KanbanTaskCard
                key={task._id}
                task={task}
                index={index}
                onOpen={onOpenTask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
