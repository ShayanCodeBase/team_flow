import CreateTaskDialog from "@/components/workspace/task/create-task-dialog";
import KanbanBoard from "@/components/workspace/task/kanban/kanban-board";
import TaskViewSwitcher from "@/components/workspace/task/task-view-switcher";

export default function Kanban() {
  return (
    <div className="flex flex-col gap-4 pt-3 h-[calc(100vh-8rem)] min-h-[520px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kanban Board</h2>
          <p className="text-muted-foreground">
            Drag cards between columns to update task status
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <TaskViewSwitcher active="kanban" />
          <CreateTaskDialog />
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0 gap-3">
        <KanbanBoard />
      </div>
    </div>
  );
}
