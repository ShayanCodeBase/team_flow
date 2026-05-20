import { TaskStatusEnum, TaskStatusEnumType } from "@/constant";
import { TaskType } from "@/types/api.type";
import { KANBAN_COLUMN_ORDER } from "./kanban-constants";

export type TasksByColumn = Record<TaskStatusEnumType, TaskType[]>;

export const groupTasksByStatus = (tasks: TaskType[]): TasksByColumn => {
  const columns = Object.fromEntries(
    KANBAN_COLUMN_ORDER.map((status) => [status, [] as TaskType[]])
  ) as TasksByColumn;

  for (const task of tasks) {
    if (KANBAN_COLUMN_ORDER.includes(task.status)) {
      columns[task.status].push(task);
    }
  }

  return columns;
};

export type KanbanFilters = {
  assigneeIds: string[];
  projectId: string | null;
  dueAfter: Date | null;
  dueBefore: Date | null;
};

export const emptyKanbanFilters = (): KanbanFilters => ({
  assigneeIds: [],
  projectId: null,
  dueAfter: null,
  dueBefore: null,
});

export const filterTasksForKanban = (
  tasks: TaskType[],
  filters: KanbanFilters
): TaskType[] => {
  return tasks.filter((task) => {
    if (filters.projectId && task.projectId !== filters.projectId) {
      return false;
    }
    if (filters.assigneeIds.length > 0) {
      const taskAssigneeIds = task.assignees.map((a) => a._id);
      const hasMatch = filters.assigneeIds.some((id) =>
        taskAssigneeIds.includes(id)
      );
      if (!hasMatch) return false;
    }
    return true;
  });
};

export const applyDragToColumns = (
  columns: TasksByColumn,
  source: { droppableId: string; index: number },
  destination: { droppableId: string; index: number },
  draggableId: string
): TasksByColumn => {
  const sourceStatus = source.droppableId as TaskStatusEnumType;
  const destStatus = destination.droppableId as TaskStatusEnumType;

  const next = KANBAN_COLUMN_ORDER.reduce((acc, status) => {
    acc[status] = [...columns[status]];
    return acc;
  }, {} as TasksByColumn);

  const sourceList = next[sourceStatus];
  if (sourceList[source.index]?._id !== draggableId) {
    const taskIndex = sourceList.findIndex((t) => t._id === draggableId);
    if (taskIndex === -1) return columns;
    const [moved] = sourceList.splice(taskIndex, 1);
    const updatedTask: TaskType = { ...moved, status: destStatus };
    next[destStatus].splice(destination.index, 0, updatedTask);
    return next;
  }

  const [moved] = sourceList.splice(source.index, 1);
  const updatedTask: TaskType = { ...moved, status: destStatus };
  next[destStatus].splice(destination.index, 0, updatedTask);

  return next;
};

export const isTaskTargetDateOverdue = (task: TaskType): boolean => {
  if (!task.targetDate) return false;
  if (
    task.status === TaskStatusEnum.DONE ||
    task.status === TaskStatusEnum.CANCELLED
  ) {
    return false;
  }
  return (
    task.status === TaskStatusEnum.OVERDUE ||
    new Date(task.targetDate) < new Date(new Date().setHours(0, 0, 0, 0))
  );
};
