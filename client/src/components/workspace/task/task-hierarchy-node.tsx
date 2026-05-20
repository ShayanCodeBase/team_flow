import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  CornerUpLeft,
  ExternalLink,
  Loader,
  Plus,
} from "lucide-react";
import EditTaskDialog from "./edit-task-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskType } from "@/types/api.type";
import { getTaskChildrenQueryFn, moveTaskMutationFn } from "@/lib/api";
import { invalidateTaskQueries } from "@/lib/query-invalidation";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { toast } from "@/hooks/use-toast";
import CreateSubtaskForm from "./create-subtask-form";

type TaskHierarchyNodeProps = {
  task: TaskType;
  projectId: string;
  depth?: number;
};

export default function TaskHierarchyNode({
  task,
  projectId,
  depth = 0,
}: TaskHierarchyNodeProps) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["task-children", workspaceId, projectId, task._id],
    queryFn: () =>
      getTaskChildrenQueryFn({
        workspaceId,
        projectId,
        taskId: task._id,
      }),
    enabled: expanded,
  });

  const children = data?.tasks ?? [];

  const { mutate: moveToRoot, isPending: isMoving } = useMutation({
    mutationFn: moveTaskMutationFn,
    onSuccess: () => {
      invalidateTaskQueries(queryClient, { workspaceId, projectId });
      toast({ title: "Task moved to root", variant: "success" });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not move task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-1 py-1.5 rounded-md hover:bg-muted/50 group"
        style={{ paddingLeft: depth * 12 }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {isLoading || isFetching ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {task.taskCode}
        </span>
        <span className="text-sm truncate flex-1 min-w-0">{task.title}</span>
        <Badge
          variant="outline"
          className="text-[10px] shrink-0 hidden sm:inline-flex"
        >
          {task.status}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
          title="Open task"
          onClick={() => setEditOpen(true)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        {task.parentTaskId && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
            title="Move to root"
            disabled={isMoving}
            onClick={() =>
              moveToRoot({
                workspaceId,
                projectId,
                taskId: task._id,
                newParentId: null,
              })
            }
          >
            <CornerUpLeft className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setShowCreateForm((v) => !v)}
          aria-label="Add subtask"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {showCreateForm && (
        <div style={{ paddingLeft: depth * 12 + 28 }} className="pb-2">
          <CreateSubtaskForm
            parentTaskId={task._id}
            projectId={projectId}
            onSuccess={() => {
              setShowCreateForm(false);
              setExpanded(true);
              queryClient.invalidateQueries({
                queryKey: ["task-children", workspaceId, projectId, task._id],
              });
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TaskHierarchyNode
              key={child._id}
              task={child}
              projectId={projectId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {expanded && !isLoading && children.length === 0 && (
        <p
          className="text-xs text-muted-foreground py-1"
          style={{ paddingLeft: depth * 12 + 28 }}
        >
          No nested subtasks
        </p>
      )}

      <EditTaskDialog
        task={task}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
