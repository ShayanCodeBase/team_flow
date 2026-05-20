import { Link, useLocation } from "react-router-dom";
import { Columns3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useWorkspaceId from "@/hooks/use-workspace-id";

type TaskView = "table" | "kanban";

type TaskViewSwitcherProps = {
  active: TaskView;
};

export default function TaskViewSwitcher({ active }: TaskViewSwitcherProps) {
  const workspaceId = useWorkspaceId();
  const location = useLocation();

  const tasksPath = `/workspace/${workspaceId}/tasks`;
  const kanbanPath = `/workspace/${workspaceId}/kanban`;

  const isTableActive =
    active === "table" || location.pathname === tasksPath;
  const isKanbanActive =
    active === "kanban" || location.pathname === kanbanPath;

  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-2.5 gap-1.5",
          isTableActive && "bg-background shadow-sm text-foreground"
        )}
        asChild
      >
        <Link to={tasksPath} aria-current={isTableActive ? "page" : undefined}>
          <List className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:inline text-xs">Table</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-2.5 gap-1.5",
          isKanbanActive && "bg-background shadow-sm text-foreground"
        )}
        asChild
      >
        <Link
          to={kanbanPath}
          aria-current={isKanbanActive ? "page" : undefined}
        >
          <Columns3 className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:inline text-xs">Kanban</span>
        </Link>
      </Button>
    </div>
  );
}
