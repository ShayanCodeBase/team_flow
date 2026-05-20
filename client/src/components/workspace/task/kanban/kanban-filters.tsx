import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTableFacetedFilter } from "../table/table-faceted-filter";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KanbanFilters } from "./kanban-utils";

type KanbanFiltersBarProps = {
  filters: KanbanFilters;
  onFiltersChange: (filters: KanbanFilters) => void;
};

type KanbanDateFilterProps = {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
};

function KanbanDateFilter({ label, value, onChange }: KanbanDateFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {value ? format(value, "PPP") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => onChange(date ?? null)}
          initialFocus
          defaultMonth={value ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}

export default function KanbanFiltersBar({
  filters,
  onFiltersChange,
}: KanbanFiltersBarProps) {
  const workspaceId = useWorkspaceId();
  const { data: projectData } = useGetProjectsInWorkspaceQuery({ workspaceId });
  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  const projects = projectData?.projects ?? [];
  const members = memberData?.members ?? [];

  const projectOptions = projects.map((project) => ({
    label: (
      <div className="flex items-center gap-1">
        <span>{project.emoji}</span>
        <span>{project.name}</span>
      </div>
    ),
    value: project._id,
  }));

  const assigneeOptions = members.map((member) => {
    const name = member.userId?.name || "Unknown";
    const initials = getAvatarFallbackText(name);
    const avatarColor = getAvatarColor(name);
    return {
      label: (
        <div className="flex items-center space-x-2">
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={member.userId?.profilePicture || ""}
              alt={name}
            />
            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
        </div>
      ),
      value: member.userId._id,
    };
  });

  const hasAssigneeOrProjectFilters =
    filters.assigneeIds.length > 0 || filters.projectId !== null;
  const hasDateFilters = Boolean(filters.dueAfter || filters.dueBefore);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <DataTableFacetedFilter
        title="Assigned To"
        multiSelect={true}
        options={assigneeOptions}
        selectedValues={filters.assigneeIds}
        onFilterChange={(values) =>
          onFiltersChange({ ...filters, assigneeIds: values })
        }
      />
      <DataTableFacetedFilter
        title="Project"
        multiSelect={false}
        options={projectOptions}
        selectedValues={filters.projectId ? [filters.projectId] : []}
        onFilterChange={(values) =>
          onFiltersChange({
            ...filters,
            projectId: values[0] ?? null,
          })
        }
      />
      <KanbanDateFilter
        label="Due After"
        value={filters.dueAfter}
        onChange={(dueAfter) => onFiltersChange({ ...filters, dueAfter })}
      />
      <KanbanDateFilter
        label="Due Before"
        value={filters.dueBefore}
        onChange={(dueBefore) => onFiltersChange({ ...filters, dueBefore })}
      />
      {hasDateFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() =>
            onFiltersChange({
              ...filters,
              dueAfter: null,
              dueBefore: null,
            })
          }
        >
          Clear dates
          <X className="ml-1 h-4 w-4" />
        </Button>
      )}
      {hasAssigneeOrProjectFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() =>
            onFiltersChange({
              ...filters,
              assigneeIds: [],
              projectId: null,
            })
          }
        >
          Clear filters
          <X className="ml-1 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
