import CreateTaskDialog from "@/components/workspace/task/create-task-dialog";
import TaskTable from "@/components/workspace/task/task-table";
import TaskViewSwitcher from "@/components/workspace/task/task-view-switcher";

export default function Tasks() {
  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tasks</h2>
          <p className="text-muted-foreground">
            Here&apos;s the list of tasks for this workspace!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TaskViewSwitcher active="table" />
          <CreateTaskDialog />
        </div>
      </div>
      <div>
        <TaskTable />
      </div>
    </div>
  );
}
