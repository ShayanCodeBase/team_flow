import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditTaskForm from "./edit-task-form";
import TaskHierarchyPanel from "./task-hierarchy-panel";
import CommentThread from "./comment-thread";
import TaskActivityThread from "./task-activity-thread";
import { TaskType } from "@/types/api.type";
import useWorkspaceId from "@/hooks/use-workspace-id";

type EditTaskDialogProps = {
  task: TaskType;
  isOpen: boolean;
  onClose: () => void;
  onOpenChange?: (open: boolean) => void;
};

const EditTaskDialog = ({
  task,
  isOpen,
  onClose,
  onOpenChange,
}: EditTaskDialogProps) => {
  const routeWorkspaceId = useWorkspaceId();
  const workspaceId = routeWorkspaceId || task.workspaceId;
  const projectId = task.project?._id ?? task.projectId;
  const [commentCount, setCommentCount] = useState(0);
  const [activeTab, setActiveTab] = useState("comments");

  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open);
    if (!open) {
      onClose();
      setActiveTab("comments");
    }
  };

  return (
    <Dialog modal open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto my-5 border-0"
        accessibilityTitle="Edit task"
        accessibilityDescription="View and update task details, subtasks, and comments"
      >
        <EditTaskForm task={task} onClose={onClose} />
        {projectId && (
          <TaskHierarchyPanel rootTaskId={task._id} projectId={projectId} />
        )}
        <Separator />
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="comments" className="flex-1 gap-1.5">
              Comments
              <Badge variant="secondary" className="text-xs font-normal">
                {commentCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              Activity
            </TabsTrigger>
          </TabsList>
          <TabsContent value="comments" className="mt-3">
            {isOpen && workspaceId && (
              <CommentThread
                taskId={task._id}
                workspaceId={workspaceId}
                onTotalCountChange={setCommentCount}
              />
            )}
          </TabsContent>
          <TabsContent value="activity" className="mt-3">
            {isOpen && workspaceId && activeTab === "activity" && (
              <TaskActivityThread
                taskId={task._id}
                workspaceId={workspaceId}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
