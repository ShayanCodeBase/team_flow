import CreateTaskDialog from "@/components/workspace/task/create-task-dialog";
import TaskCalendar from "@/components/workspace/task/calendar/task-calendar";

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-4 pt-3 h-[calc(100vh-8rem)] min-h-[520px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">
            View tasks by due date — click a day to create, click a task to
            edit
          </p>
        </div>
        <CreateTaskDialog />
      </div>

      <div className="flex flex-col flex-1 min-h-0 gap-3">
        <TaskCalendar />
      </div>
    </div>
  );
}
