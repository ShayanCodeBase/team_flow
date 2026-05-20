import { format, endOfWeek, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavigateAction, View } from "react-big-calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarToolbarProps = {
  date: Date;
  view: View;
  onNavigate: (action: NavigateAction) => void;
  onViewChange: (view: View) => void;
};

export default function CalendarToolbar({
  date,
  view,
  onNavigate,
  onViewChange,
}: CalendarToolbarProps) {
  const label =
    view === "week"
      ? `${format(startOfWeek(date), "MMM d")} – ${format(endOfWeek(date), "MMM d, yyyy")}`
      : format(date, "MMMM yyyy");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onNavigate("TODAY")}
        >
          Today
        </Button>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onNavigate("PREV")}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onNavigate("NEXT")}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-center text-sm font-semibold tracking-tight sm:text-base">
        {label}
      </p>

      <div className="inline-flex items-center justify-end rounded-lg border bg-muted/40 p-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 text-xs",
            view === "month" && "bg-background shadow-sm text-foreground"
          )}
          onClick={() => onViewChange("month")}
        >
          Month
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 text-xs",
            view === "week" && "bg-background shadow-sm text-foreground"
          )}
          onClick={() => onViewChange("week")}
        >
          Week
        </Button>
      </div>
    </div>
  );
}
