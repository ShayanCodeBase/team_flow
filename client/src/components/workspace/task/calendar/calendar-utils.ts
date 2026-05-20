import { endOfDay, startOfDay } from "date-fns";
import { TaskType } from "@/types/api.type";

export type CalendarTaskEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: TaskType;
};

function getTaskDateString(task: TaskType): string | undefined {
  return task.targetDate ?? task.startDate ?? undefined;
}

/** Subtasks often lack dates; inherit from parent chain (same tasks list as Kanban). */
export function resolveTaskCalendarDate(
  task: TaskType,
  taskById: Map<string, TaskType>
): string | undefined {
  const own = getTaskDateString(task);
  if (own) return own;

  let parentId = task.parentTaskId;
  const visited = new Set<string>();

  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = taskById.get(parentId);
    if (!parent) break;

    const parentDate = getTaskDateString(parent);
    if (parentDate) return parentDate;

    parentId = parent.parentTaskId ?? null;
  }

  return undefined;
}

export function mapTasksToCalendarEvents(
  tasks: TaskType[]
): CalendarTaskEvent[] {
  const taskById = new Map(tasks.map((task) => [task._id, task]));
  const events: CalendarTaskEvent[] = [];

  for (const task of tasks) {
    const dateStr = resolveTaskCalendarDate(task, taskById);
    if (!dateStr) continue;

    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) continue;

    const start = startOfDay(parsed);
    const end = endOfDay(parsed);

    events.push({
      id: task._id,
      title: task.title,
      start,
      end,
      resource: task,
    });
  }

  return events;
}

export function getCalendarEventStatusClass(status: string): string {
  return `calendar-event-root--${status.toLowerCase().replace(/_/g, "-")}`;
}
