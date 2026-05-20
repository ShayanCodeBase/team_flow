import { Column, ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";
import { Repeat } from "lucide-react";

import { TaskTableSortField } from "@/hooks/use-task-table-filter";
import {
  DataTableColumnHeader,
  DataTableServerColumnHeader,
  TaskTableSortState,
} from "./table-column-header";
import { DataTableRowActions } from "./table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  TASK_STATUS_CONFIG,
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import {
  getAvatarColor,
  getAvatarFallbackText,
} from "@/lib/helper";
import { getPrimaryAssignee } from "@/lib/task-helpers";
import { hasRecurrence } from "@/lib/recurrence";
import { priorities, statuses } from "./data";
import { TaskType } from "@/types/api.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type TaskTableColumnOptions = {
  showSubtaskHierarchy?: boolean;
  tasksOnPage?: TaskType[];
};

export const getColumns = (
  projectId?: string,
  sort?: TaskTableSortState,
  options?: TaskTableColumnOptions
): ColumnDef<TaskType>[] => {
  const showSubtaskHierarchy = options?.showSubtaskHierarchy ?? false;
  const taskCodeById = new Map(
    (options?.tasksOnPage ?? []).map((t) => [t._id, t.taskCode])
  );
  const sortableHeader = (title: string, sortKey: TaskTableSortField) =>
    sort ? (
      <DataTableServerColumnHeader title={title} sortKey={sortKey} sort={sort} />
    ) : (
      title
    );

  const columns: ColumnDef<TaskType>[] = [
    {
      id: "_id",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: () => sortableHeader("Title", "title"),
      cell: ({ row }) => {
        const task = row.original;
        const isSubtask = Boolean(task.parentTaskId);
        const indent =
          showSubtaskHierarchy && task.level > 0 ? task.level * 14 : 0;
        const parentCode = task.parentTaskId
          ? taskCodeById.get(task.parentTaskId)
          : undefined;

        return (
          <div
            className="flex flex-wrap items-center gap-x-2 gap-y-1"
            style={{ paddingLeft: indent }}
          >
            {showSubtaskHierarchy && isSubtask && (
              <Badge
                variant="secondary"
                className="text-[10px] shrink-0 font-normal"
              >
                {parentCode ? `↳ ${parentCode}` : "Subtask"}
              </Badge>
            )}
            <Badge variant="outline" className="capitalize shrink-0 h-[25px]">
              {task.taskCode}
            </Badge>
            {hasRecurrence(task.recurrence) && (
              <Repeat
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-label="Recurring task"
              />
            )}
            <span className="block max-w-[140px] sm:max-w-[200px] lg:max-w-[220px] font-medium truncate">
              {task.title}
            </span>
          </div>
        );
      },
      enableSorting: false,
    },
    ...(projectId
      ? []
      : [
          {
            accessorKey: "project",
            header: ({ column }: { column: Column<TaskType, unknown> }) => (
              <DataTableColumnHeader column={column} title="Project" />
            ),
            cell: ({ row }: { row: Row<TaskType> }) => {
              const project = row.original.project;

              if (!project) {
                return null;
              }

              return (
                <div className="flex items-center gap-1">
                  <span className="rounded-full border">{project.emoji}</span>
                  <span className="block capitalize truncate w-[100px] text-ellipsis">
                    {project.name}
                  </span>
                </div>
              );
            },
            enableSorting: false,
          },
        ]),
    {
      id: "assignees",
      header: "Assigned To",
      cell: ({ row }) => {
        const assignees = row.original.assignees ?? [];
        if (assignees.length === 0) return null;

        const primary = getPrimaryAssignee(row.original);
        const name = primary?.name ?? "";
        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);

        return (
          <div className="flex items-center gap-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={primary?.profilePicture || ""} alt={name} />
              <AvatarFallback className={avatarColor}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="block text-ellipsis w-[100px] truncate">
              {name}
              {assignees.length > 1 ? ` +${assignees.length - 1}` : ""}
            </span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "targetDate",
      header: () => sortableHeader("Due Date", "targetDate"),
      cell: ({ row }) => {
        return (
          <span className="lg:max-w-[100px] text-sm">
            {row.original.targetDate
              ? format(new Date(row.original.targetDate), "PPP")
              : null}
          </span>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: () => sortableHeader("Status", "status"),
      cell: ({ row }) => {
        const status = statuses.find(
          (status) => status.value === row.getValue("status")
        );

        if (!status) {
          return null;
        }

        const statusKey = status.value as TaskStatusEnumType;
        const Icon = status.icon;
        const statusConfig = TASK_STATUS_CONFIG[statusKey];

        if (!Icon) {
          return null;
        }

        return (
          <div className="flex items-center min-w-[88px]">
            <Badge
              variant={TaskStatusEnum[statusKey]}
              className="flex w-auto p-1 px-1.5 sm:px-2 gap-1 text-[10px] sm:text-xs font-medium shadow-sm border-0"
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full text-inherit shrink-0" />
              <span
                className={cn(
                  statusConfig.strikethrough ? "line-through" : "",
                  "whitespace-nowrap"
                )}
              >
                {status.label}
              </span>
            </Badge>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "priority",
      header: () => sortableHeader("Priority", "priority"),
      cell: ({ row }) => {
        const priority = priorities.find(
          (priority) => priority.value === row.getValue("priority")
        );

        if (!priority) {
          return null;
        }

        const statusKey = priority.value as TaskPriorityEnumType;
        const Icon = priority.icon;

        if (!Icon) {
          return null;
        }

        return (
          <div className="flex items-center">
            <Badge
              variant={TaskPriorityEnum[statusKey]}
              className="flex lg:w-[110px] p-1 gap-1 !bg-transparent font-medium !shadow-none uppercase border-0"
            >
              <Icon className="h-4 w-4 rounded-full text-inherit" />
              <span>{priority.label}</span>
            </Badge>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: () => sortableHeader("Created", "createdAt"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {row.original.createdAt
            ? format(new Date(row.original.createdAt), "PPP")
            : "—"}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <>
            <DataTableRowActions row={row} />
          </>
        );
      },
    },
  ];

  return columns;
};
