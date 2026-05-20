import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getTaskChildrenQueryFn } from "@/lib/api";
import useWorkspaceId from "@/hooks/use-workspace-id";
import CreateSubtaskForm from "./create-subtask-form";
import TaskHierarchyNode from "./task-hierarchy-node";

type TaskHierarchyPanelProps = {
  rootTaskId: string;
  projectId: string;
};

export default function TaskHierarchyPanel({
  rootTaskId,
  projectId,
}: TaskHierarchyPanelProps) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["task-hierarchy-root", workspaceId, projectId, rootTaskId],
    queryFn: () =>
      getTaskChildrenQueryFn({
        workspaceId,
        projectId,
        taskId: rootTaskId,
      }),
  });

  const children = data?.tasks ?? [];

  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Subtasks</h3>
          <p className="text-xs text-muted-foreground">
            Expand rows to load nested children
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCreateForm((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add subtask
        </Button>
      </div>

      {showCreateForm && (
        <CreateSubtaskForm
          parentTaskId={rootTaskId}
          projectId={projectId}
          hierarchyRootTaskId={rootTaskId}
          onSuccess={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({
              queryKey: [
                "task-hierarchy-root",
                workspaceId,
                projectId,
                rootTaskId,
              ],
            });
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : children.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No subtasks yet. Add one to build a hierarchy.
        </p>
      ) : (
        <div className="max-h-56 overflow-y-auto pr-1 border rounded-md p-2">
          {children.map((child) => (
            <TaskHierarchyNode
              key={child._id}
              task={child}
              projectId={projectId}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
