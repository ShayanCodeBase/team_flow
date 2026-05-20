import { useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
  TaskPriorityEnum,
  TaskStatusEnum,
} from "@/constant";
import {
  getAvatarColor,
  getAvatarFallbackText,
  transformOptions,
} from "@/lib/helper";
import { createSubtaskMutationFn } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  invalidateSubtaskQueries,
  prependTaskToChildrenCache,
} from "@/lib/query-invalidation";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim(),
  status: z.enum(TASK_STATUS_VALUES),
  priority: z.enum(TASK_PRIORITY_VALUES),
  assignees: z.array(z.string()).default([]),
  startDate: z.date().optional(),
  targetDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const toIsoOrUndefined = (date: Date | undefined) =>
  date ? date.toISOString() : undefined;

type CreateSubtaskFormProps = {
  parentTaskId: string;
  projectId: string;
  /** Root task id when form is used inside TaskHierarchyPanel (for panel list refresh). */
  hierarchyRootTaskId?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function CreateSubtaskForm({
  parentTaskId,
  projectId,
  hierarchyRootTaskId,
  onSuccess,
  onCancel,
}: CreateSubtaskFormProps) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: createSubtaskMutationFn,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members = memberData?.members || [];

  const statusOptions = transformOptions(Object.values(TaskStatusEnum));
  const priorityOptions = transformOptions(Object.values(TaskPriorityEnum));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: TaskStatusEnum.PENDING,
      priority: TaskPriorityEnum.MEDIUM,
      assignees: [],
      tags: [],
      category: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    mutate(
      {
        workspaceId,
        projectId,
        parentTaskId,
        data: {
          title: values.title,
          description: values.description || undefined,
          status: values.status,
          priority: values.priority,
          assignees: values.assignees,
          startDate: toIsoOrUndefined(values.startDate),
          targetDate: toIsoOrUndefined(values.targetDate),
          tags: values.tags,
          category: values.category?.trim() || undefined,
        },
      },
      {
        onSuccess: (result) => {
          prependTaskToChildrenCache(queryClient, {
            workspaceId,
            projectId,
            parentTaskId,
            task: result.task,
          });
          invalidateSubtaskQueries(queryClient, {
            workspaceId,
            projectId,
            parentTaskId,
            rootTaskId: hierarchyRootTaskId,
          });
          toast({
            title: "Subtask created",
            variant: "success",
          });
          form.reset();
          onSuccess();
        },
        onError: (error) => {
          toast({
            title: "Could not create subtask",
            description: getApiErrorMessage(error),
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 rounded-md border bg-muted/40 p-3 max-h-[min(70vh,520px)] overflow-y-auto"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Subtask title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="What needs to be done?" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                Description
                <span className="text-muted-foreground font-normal ml-1">
                  Optional
                </span>
              </FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assignees"
          render={() => (
            <FormItem>
              <FormLabel className="text-xs">
                Assigned To
                <span className="text-muted-foreground font-normal ml-1">
                  Optional
                </span>
              </FormLabel>
              <div className="max-h-[140px] overflow-y-auto rounded-md border p-2 space-y-1.5 bg-background">
                {members.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No members in this workspace
                  </p>
                ) : (
                  members.map((member) => {
                    const userId = member.userId._id;
                    const name = member.userId?.name || "Unknown";
                    const initials = getAvatarFallbackText(name);
                    const avatarColor = getAvatarColor(name);

                    return (
                      <FormField
                        key={userId}
                        control={form.control}
                        name="assignees"
                        render={({ field }) => {
                          const checked = field.value.includes(userId);
                          return (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(isChecked) => {
                                    if (isChecked) {
                                      field.onChange([...field.value, userId]);
                                    } else {
                                      field.onChange(
                                        field.value.filter((id) => id !== userId)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="flex items-center gap-2 font-normal cursor-pointer text-xs">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={member.userId?.profilePicture || ""}
                                    alt={name}
                                  />
                                  <AvatarFallback className={avatarColor}>
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{name}</span>
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    );
                  })
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Start Date</FormLabel>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-1"
                      onClick={() => field.onChange(undefined)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full pl-3 text-left font-normal h-8",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                        <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetDate"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Due Date</FormLabel>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-1"
                      onClick={() => field.onChange(undefined)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full pl-3 text-left font-normal h-8",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                        <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                Tags
                <span className="text-muted-foreground font-normal ml-1">
                  Optional
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const trimmed = tagInput.trim();
                    if (!trimmed) return;
                    if (!field.value.includes(trimmed)) {
                      field.onChange([...field.value, trimmed]);
                    }
                    setTagInput("");
                  }}
                  placeholder="Type a tag and press Enter"
                  className="h-8"
                />
              </FormControl>
              {field.value.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {field.value.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
                      {tag}
                      <button
                        type="button"
                        className="rounded-full hover:bg-muted p-0.5"
                        onClick={() =>
                          field.onChange(field.value.filter((t) => t !== tag))
                        }
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                Category
                <span className="text-muted-foreground font-normal ml-1">
                  Optional
                </span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Category" className="h-8" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending && <Loader className="h-3 w-3 animate-spin mr-1" />}
            Add subtask
          </Button>
        </div>
      </form>
    </Form>
  );
}
