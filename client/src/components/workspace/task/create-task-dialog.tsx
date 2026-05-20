import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateTaskForm from "./create-task-form";

type CreateTaskDialogProps = {
  projectId?: string;
  defaultTargetDate?: Date;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

const CreateTaskDialog = ({
  projectId,
  defaultTargetDate,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
}: CreateTaskDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setIsOpen = (open: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(open);
    } else {
      setInternalOpen(open);
    }
  };

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog modal open={isOpen} onOpenChange={setIsOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus />
            New Task
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className="max-w-lg max-h-auto my-5 border-0"
        accessibilityTitle="Create task"
        accessibilityDescription="Fill in the details to create a new task"
      >
        <CreateTaskForm
          projectId={projectId}
          defaultTargetDate={defaultTargetDate}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
