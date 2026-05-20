import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  EventPropGetter,
  NavigateAction,
  SlotInfo,
  View,
} from "react-big-calendar";
import {
  addMonths,
  addWeeks,
  format,
  getDay,
  parse,
  startOfDay,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { enUS } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";

import { Card, CardContent } from "@/components/ui/card";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchAllWorkspaceTasks } from "@/lib/fetch-all-workspace-tasks";
import { TaskStatusEnumType } from "@/constant";
import CreateTaskDialog from "../create-task-dialog";
import EditTaskDialog from "../edit-task-dialog";
import CalendarToolbar from "./calendar-toolbar";
import CalendarTaskEventComponent from "./calendar-task-event";
import {
  CalendarTaskEvent,
  getCalendarEventStatusClass,
  mapTasksToCalendarEvents,
} from "./calendar-utils";
import { TaskType } from "@/types/api.type";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const SLOT_SELECT_SUPPRESS_MS = 400;

function getInitialView(): View {
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return "week";
  }
  return "month";
}

export default function TaskCalendar() {
  const workspaceId = useWorkspaceId();
  const isMobile = useIsMobile();

  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<View>(getInitialView);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [slotCreateOpen, setSlotCreateOpen] = useState(false);
  const [slotTargetDate, setSlotTargetDate] = useState<Date | undefined>();

  const suppressSlotSelectRef = useRef(false);
  const suppressSlotSelectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const suppressSlotSelection = useCallback((durationMs = SLOT_SELECT_SUPPRESS_MS) => {
    suppressSlotSelectRef.current = true;
    if (suppressSlotSelectTimerRef.current) {
      clearTimeout(suppressSlotSelectTimerRef.current);
    }
    suppressSlotSelectTimerRef.current = setTimeout(() => {
      suppressSlotSelectRef.current = false;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (suppressSlotSelectTimerRef.current) {
        clearTimeout(suppressSlotSelectTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setView("week");
    }
  }, [isMobile]);

  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ["all-tasks", workspaceId, "calendar"],
    queryFn: () => fetchAllWorkspaceTasks(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });

  const events = useMemo(() => mapTasksToCalendarEvents(tasks), [tasks]);

  const handleNavigate = useCallback(
    (action: NavigateAction) => {
      setDate((current) => {
        if (action === "TODAY") {
          return new Date();
        }
        if (action === "PREV") {
          return view === "week" ? subWeeks(current, 1) : subMonths(current, 1);
        }
        if (action === "NEXT") {
          return view === "week" ? addWeeks(current, 1) : addMonths(current, 1);
        }
        return current;
      });
    },
    [view]
  );

  const handleSelectEvent = useCallback(
    (event: CalendarTaskEvent) => {
      suppressSlotSelection();
      setSelectedTask(event.resource);
      setEditOpen(true);
    },
    [suppressSlotSelection]
  );

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      if (suppressSlotSelectRef.current || editOpen || slotCreateOpen) {
        return;
      }
      setSlotTargetDate(startOfDay(slotInfo.start));
      setSlotCreateOpen(true);
    },
    [editOpen, slotCreateOpen]
  );

  const handleEditDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        suppressSlotSelection();
        setEditOpen(false);
        setSelectedTask(null);
      }
    },
    [suppressSlotSelection]
  );

  const eventPropGetter: EventPropGetter<CalendarTaskEvent> = useCallback(
    (event) => {
      const status = event.resource.status as TaskStatusEnumType;
      return {
        className: `calendar-event-root ${getCalendarEventStatusClass(status)}`,
      };
    },
    []
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
        Failed to load calendar tasks. Please try again.
      </p>
    );
  }

  return (
    <>
      <Card className="shrink-0 shadow-sm">
        <CardContent className="p-3">
          <CalendarToolbar
            date={date}
            view={view}
            onNavigate={handleNavigate}
            onViewChange={setView}
          />
        </CardContent>
      </Card>

      <div className="task-calendar-scroll flex-1 min-h-0">
        <div className="task-calendar-host h-full min-h-[28rem]">
          <Calendar<CalendarTaskEvent>
            localizer={localizer}
            events={events}
            date={date}
            view={view}
            views={["month", "week"]}
            toolbar={false}
            selectable
            popup
            onNavigate={(newDate) => {
              setDate(newDate);
            }}
            onView={setView}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventPropGetter}
            components={{
              event: CalendarTaskEventComponent,
            }}
            culture="en-US"
            className="task-calendar"
          />
        </div>
      </div>

      <CreateTaskDialog
        hideTrigger
        open={slotCreateOpen}
        onOpenChange={(open) => {
          setSlotCreateOpen(open);
          if (!open) {
            setSlotTargetDate(undefined);
          }
        }}
        defaultTargetDate={slotTargetDate}
      />

      {selectedTask && (
        <EditTaskDialog
          task={selectedTask}
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            setSelectedTask(null);
          }}
          onOpenChange={handleEditDialogOpenChange}
        />
      )}
    </>
  );
}
