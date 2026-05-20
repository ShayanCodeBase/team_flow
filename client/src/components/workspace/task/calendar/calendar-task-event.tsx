import { EventProps } from "react-big-calendar";
import {
  TASK_PRIORITY_CONFIG,
  TaskPriorityEnumType,
} from "@/constant";
import { CalendarTaskEvent } from "./calendar-utils";

export default function CalendarTaskEventComponent({
  event,
}: EventProps<CalendarTaskEvent>) {
  const task = event.resource;
  const priorityKey = task.priority as TaskPriorityEnumType;
  const priorityLabel = TASK_PRIORITY_CONFIG[priorityKey].label;

  return (
    <div className="calendar-event-card">
      <p className="calendar-event-card__title">{event.title}</p>
      <span
        className={`calendar-event-card__priority calendar-event-card__priority--${priorityKey.toLowerCase()}`}
      >
        {priorityLabel}
      </span>
    </div>
  );
}
