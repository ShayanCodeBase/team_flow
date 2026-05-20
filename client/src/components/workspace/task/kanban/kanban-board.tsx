import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropContext,
  DragStart,
  DragUpdate,
  DropResult,
} from "@hello-pangea/dnd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { editTaskMutationFn } from "@/lib/api";
import { fetchAllWorkspaceTasks } from "@/lib/fetch-all-workspace-tasks";
import { endOfDay, startOfDay } from "date-fns";
import { invalidateTaskQueries } from "@/lib/query-invalidation";
import { TaskType } from "@/types/api.type";
import { TaskStatusEnumType } from "@/constant";
import { toast } from "@/hooks/use-toast";
import EditTaskDialog from "../edit-task-dialog";
import { KANBAN_COLUMN_ORDER } from "./kanban-constants";
import KanbanColumn from "./kanban-column";
import KanbanFiltersBar from "./kanban-filters";
import {
  applyDragToColumns,
  emptyKanbanFilters,
  filterTasksForKanban,
  groupTasksByStatus,
  KanbanFilters,
  TasksByColumn,
} from "./kanban-utils";

const AUTO_SCROLL_EDGE_PX = 100;
const AUTO_SCROLL_SPEED = 14;

export default function KanbanBoard() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<KanbanFilters>(emptyKanbanFilters());
  const [columns, setColumns] = useState<TasksByColumn | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const columnsSnapshotRef = useRef<TasksByColumn | null>(null);
  const isDraggingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pointerXRef = useRef(0);
  const autoScrollRafRef = useRef<number | null>(null);

  const performEdgeScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !isDraggingRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = pointerXRef.current;
    const distanceFromLeft = x - rect.left;
    const distanceFromRight = rect.right - x;

    if (distanceFromLeft < AUTO_SCROLL_EDGE_PX) {
      container.scrollLeft -= AUTO_SCROLL_SPEED;
    } else if (distanceFromRight < AUTO_SCROLL_EDGE_PX) {
      container.scrollLeft += AUTO_SCROLL_SPEED;
    }
  }, []);

  const autoScrollLoop = useCallback(() => {
    performEdgeScroll();
    if (isDraggingRef.current) {
      autoScrollRafRef.current = requestAnimationFrame(autoScrollLoop);
    }
  }, [performEdgeScroll]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    pointerXRef.current = event.clientX;
  }, []);

  const startAutoScroll = useCallback(() => {
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    autoScrollRafRef.current = requestAnimationFrame(autoScrollLoop);
  }, [autoScrollLoop, handlePointerMove]);

  const stopAutoScroll = useCallback(() => {
    window.removeEventListener("pointermove", handlePointerMove);
    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, [handlePointerMove]);

  useEffect(() => {
    return () => stopAutoScroll();
  }, [stopAutoScroll]);

  const dueAfterIso = filters.dueAfter
    ? startOfDay(filters.dueAfter).toISOString()
    : null;
  const dueBeforeIso = filters.dueBefore
    ? endOfDay(filters.dueBefore).toISOString()
    : null;

  const { data: allTasks = [], isLoading, isError } = useQuery({
    queryKey: [
      "kanban-tasks",
      workspaceId,
      dueAfterIso,
      dueBeforeIso,
    ],
    queryFn: () =>
      fetchAllWorkspaceTasks({
        workspaceId,
        dueAfter: dueAfterIso ?? undefined,
        dueBefore: dueBeforeIso ?? undefined,
      }),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });

  const filteredTasks = useMemo(
    () => filterTasksForKanban(allTasks, filters),
    [allTasks, filters]
  );

  useEffect(() => {
    setColumns(groupTasksByStatus(filteredTasks));
  }, [filteredTasks]);

  const { mutate: updateTaskStatus } = useMutation({
    mutationFn: editTaskMutationFn,
  });

  const handleOpenTask = useCallback((task: TaskType) => {
    if (isDraggingRef.current) return;
    setSelectedTask(task);
    setEditOpen(true);
  }, []);

  const handleDragStart = useCallback(
    (_initial: DragStart) => {
      isDraggingRef.current = true;
      startAutoScroll();
    },
    [startAutoScroll]
  );

  const handleDragUpdate = useCallback(
    (_update: DragUpdate) => {
      performEdgeScroll();
    },
    [performEdgeScroll]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      stopAutoScroll();
      window.setTimeout(() => {
        isDraggingRef.current = false;
      }, 0);

      const { destination, source, draggableId } = result;
      if (!destination || !columns) return;

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const previousColumns = columns;
      columnsSnapshotRef.current = previousColumns;

      const nextColumns = applyDragToColumns(
        columns,
        source,
        destination,
        draggableId
      );
      setColumns(nextColumns);

      const destStatus = destination.droppableId as TaskStatusEnumType;
      const task =
        previousColumns[source.droppableId as TaskStatusEnumType].find(
          (t) => t._id === draggableId
        ) ??
        nextColumns[destStatus].find((t) => t._id === draggableId);

      if (!task) {
        setColumns(previousColumns);
        return;
      }

      const projectId = task.project?._id ?? task.projectId;

      updateTaskStatus(
        {
          workspaceId,
          projectId,
          taskId: task._id,
          data: { status: destStatus },
        },
        {
          onSuccess: () => {
            invalidateTaskQueries(queryClient, {
              workspaceId,
              projectId,
            });
          },
          onError: (error: Error) => {
            setColumns(columnsSnapshotRef.current ?? previousColumns);
            toast({
              title: "Could not update task",
              description: error.message,
              variant: "destructive",
            });
          },
        }
      );
    },
    [columns, queryClient, stopAutoScroll, updateTaskStatus, workspaceId]
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[320px]">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-8 text-center">
        Failed to load tasks. Please try again.
      </p>
    );
  }

  if (!columns) {
    return null;
  }

  return (
    <>
      <KanbanFiltersBar filters={filters} onFiltersChange={setFilters} />

      <DragDropContext
        onDragStart={handleDragStart}
        onDragUpdate={handleDragUpdate}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0 snap-x snap-mandatory scroll-smooth md:snap-none"
        >
          {KANBAN_COLUMN_ORDER.map((status) => (
            <div
              key={status}
              className="snap-center h-full min-h-0 flex shrink-0"
            >
              <KanbanColumn
                status={status}
                tasks={columns[status]}
                onOpenTask={handleOpenTask}
              />
            </div>
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <EditTaskDialog
          task={selectedTask}
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            setSelectedTask(null);
            invalidateTaskQueries(queryClient, {
              workspaceId,
              projectId: selectedTask.project?._id ?? selectedTask.projectId,
            });
          }}
        />
      )}
    </>
  );
}
