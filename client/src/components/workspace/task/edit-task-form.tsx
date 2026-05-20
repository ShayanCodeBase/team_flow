import { useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../../ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getAvatarColor,
  getAvatarFallbackText,
} from "@/lib/helper";
import useWorkspaceId from "@/hooks/use-workspace-id";
import {
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
  TaskPriorityEnum,
  TaskStatusEnum,
} from "@/constant";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { editTaskMutationFn } from "@/lib/api";
import { invalidateTaskQueries } from "@/lib/query-invalidation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { TaskType } from "@/types/api.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  formValuesToRecurrence,
  recurrenceToFormDefaults,
  recurrenceZodFields,
  validateRecurrenceFormFields,
} from "@/lib/recurrence";
import TaskRecurrenceFields from "./task-recurrence-fields";

const formSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required" }),
  description: z.string().trim(),
  status: z.enum(TASK_STATUS_VALUES),
  priority: z.enum(TASK_PRIORITY_VALUES),
  assignees: z.array(z.string()).default([]),
  startDate: z.date().optional(),
  targetDate: z.date().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  ...recurrenceZodFields,
}).superRefine(validateRecurrenceFormFields);

type FormValues = z.infer<typeof formSchema>;

const toIsoOrUndefined = (date: Date | undefined) =>
  date ? date.toISOString() : undefined;

export default function EditTaskForm({
  task,
  onClose,
}: {
  task: TaskType;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [tagInput, setTagInput] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: editTaskMutationFn,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members = memberData?.members || [];

  const statusOptions = Object.values(TaskStatusEnum).map((status) => ({
    label: status.charAt(0) + status.slice(1).toLowerCase(),
    value: status,
  }));

  const priorityOptions = Object.values(TaskPriorityEnum).map((priority) => ({
    label: priority.charAt(0) + priority.slice(1).toLowerCase(),
    value: priority,
  }));

  const recurrenceDefaults = recurrenceToFormDefaults(task.recurrence);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? TaskStatusEnum.PENDING,
      priority: task?.priority ?? TaskPriorityEnum.MEDIUM,
      assignees: task.assignees?.map((assignee) => assignee._id) ?? [],
      startDate: task.startDate ? new Date(task.startDate) : undefined,
      targetDate: task.targetDate ? new Date(task.targetDate) : undefined,
      tags: task.tags ?? [],
      category: task.category ?? "",
      recurrencePreset: recurrenceDefaults.recurrencePreset,
      recurrenceInterval: recurrenceDefaults.recurrenceInterval,
      recurrenceUnit: recurrenceDefaults.recurrenceUnit,
    },
  });

  const recurrencePreset = form.watch("recurrencePreset");

  const onSubmit = (values: FormValues) => {
    if (isPending) return;

    const payload = {
      workspaceId,
      projectId: task.project?._id ?? "",
      taskId: task._id,
      data: {
        title: values.title,
        description: values.description || undefined,
        status: values.status,
        priority: values.priority,
        assignees: values.assignees,
        targetDate: toIsoOrUndefined(values.targetDate),
        startDate: toIsoOrUndefined(values.startDate),
        tags: values.tags,
        category: values.category?.trim() || undefined,
        recurrence: formValuesToRecurrence(
          values.recurrencePreset,
          values.recurrenceInterval,
          values.recurrenceUnit
        ),
      },
    };

    mutate(payload, {
      onSuccess: () => {
        invalidateTaskQueries(queryClient, {
          workspaceId,
          projectId: task.project?._id ?? task.projectId,
          taskId: task._id,
        });
        toast({
          title: "Success",
          description: "Task updated successfully",
          variant: "success",
        });
        onClose();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl font-semibold text-center sm:text-left">
            Edit Task
          </h1>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Task title" />
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
                  <FormLabel>Task Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} placeholder="Description" />
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
                  <FormLabel>
                    Assigned To
                    <span className="text-xs font-extralight ml-2 text-muted-foreground">
                      Optional
                    </span>
                  </FormLabel>
                  <div className="max-h-[200px] overflow-y-auto rounded-md border p-3 space-y-2">
                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
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
                                          field.onChange([
                                            ...field.value,
                                            userId,
                                          ]);
                                        } else {
                                          field.onChange(
                                            field.value.filter(
                                              (id) => id !== userId
                                            )
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="flex items-center gap-2 font-normal cursor-pointer">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={
                                          member.userId?.profilePicture || ""
                                        }
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

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      Start Date
                      <span className="text-xs font-extralight ml-2 text-muted-foreground">
                        Optional
                      </span>
                    </FormLabel>
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
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
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            "Pick a date"
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
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
                    <FormLabel>
                      Due Date
                      <span className="text-xs font-extralight ml-2 text-muted-foreground">
                        Optional
                      </span>
                    </FormLabel>
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => field.onChange(undefined)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className="w-full">
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            "Pick a date"
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TaskRecurrenceFields recurrencePreset={recurrencePreset} />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tags
                    <span className="text-xs font-extralight ml-2 text-muted-foreground">
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
                    />
                  </FormControl>
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {field.value.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {tag}
                          <button
                            type="button"
                            className="rounded-full hover:bg-muted p-0.5"
                            onClick={() =>
                              field.onChange(
                                field.value.filter((t) => t !== tag)
                              )
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
                  <FormLabel>
                    Category
                    <span className="text-xs font-extralight ml-2 text-muted-foreground">
                      Optional
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {task.startedOn ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium leading-none">Started On</p>
                <p className="text-sm text-muted-foreground rounded-md border bg-muted/40 px-3 py-2">
                  {format(new Date(task.startedOn), "PPp")}
                </p>
              </div>
            ) : null}

            {task.completedOn ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium leading-none">Completed On</p>
                <p className="text-sm text-muted-foreground rounded-md border bg-muted/40 px-3 py-2">
                  {format(new Date(task.completedOn), "PPp")}
                </p>
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
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
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader className="animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
