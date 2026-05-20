import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import EditTaskDialog from "@/components/workspace/task/edit-task-dialog";
import { findTaskInWorkspace } from "@/lib/find-task-in-workspace";
import { toast } from "@/hooks/use-toast";
import { TaskType } from "@/types/api.type";
import useWorkspaceId from "@/hooks/use-workspace-id";

type TaskDialogContextValue = {
  openTaskById: (taskId: string, workspaceId: string) => Promise<void>;
};

const TaskDialogContext = createContext<TaskDialogContextValue | undefined>(
  undefined
);

export const TaskDialogProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const navigate = useNavigate();
  const currentWorkspaceId = useWorkspaceId();
  const [task, setTask] = useState<TaskType | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openTaskById = useCallback(
    async (taskId: string, workspaceId: string) => {
      if (workspaceId !== currentWorkspaceId) {
        navigate(`/workspace/${workspaceId}`);
      }

      const found = await findTaskInWorkspace(workspaceId, taskId);
      if (!found) {
        toast({
          title: "Task not found",
          description: "This task may have been deleted or moved.",
          variant: "destructive",
        });
        return;
      }

      setTask(found);
      setIsOpen(true);
    },
    [currentWorkspaceId, navigate]
  );

  const value = useMemo(
    () => ({
      openTaskById,
    }),
    [openTaskById]
  );

  return (
    <TaskDialogContext.Provider value={value}>
      {children}
      {task && (
        <EditTaskDialog
          task={task}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setTask(null);
          }}
        />
      )}
    </TaskDialogContext.Provider>
  );
};

export const useTaskDialog = (): TaskDialogContextValue => {
  const context = useContext(TaskDialogContext);
  if (!context) {
    throw new Error("useTaskDialog must be used within TaskDialogProvider");
  }
  return context;
};
