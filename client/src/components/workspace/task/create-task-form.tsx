import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  getAvatarColor,
  getAvatarFallbackText,
  transformOptions,
} from "@/lib/helper";
import useWorkspaceId from "@/hooks/use-workspace-id";
import {
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
  TaskPriorityEnum,
  TaskStatusEnum,
} from "@/constant";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import useGetWorkspaceMembers from "@/hooks/api/use-get-workspace-members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createTaskMutationFn } from "@/lib/api";
import { invalidateTaskQueries } from "@/lib/query-invalidation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  formValuesToRecurrence,
  recurrenceZodFields,
  validateRecurrenceFormFields,
} from "@/lib/recurrence";
import TaskRecurrenceFields from "./task-recurrence-fields";

const formSchema = z.object({
  title: z.string().trim().min(1, {
    message: "Title is required",
  }),
  description: z.string().trim(),
  projectId: z.string().trim().min(1, {
    message: "Project is required",
  }),
  status: z.enum(TASK_STATUS_VALUES, {
    required_error: "Status is required",
  }),
  priority: z.enum(TASK_PRIORITY_VALUES, {
    required_error: "Priority is required",
  }),
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

export default function CreateTaskForm(props: {
  projectId?: string;
  defaultTargetDate?: Date;
  onClose: () => void;
}) {
  const { projectId, defaultTargetDate, onClose } = props;

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [tagInput, setTagInput] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: createTaskMutationFn,
  });

  const { data, isLoading } = useGetProjectsInWorkspaceQuery({
    workspaceId,
    skip: !!projectId,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  const projects = data?.projects || [];
  const members = memberData?.members || [];

  const projectOptions = projects?.map((project) => {
    return {
      label: (
        <div className="flex items-center gap-1">
          <span>{project.emoji}</span>
          <span>{project.name}</span>
        </div>
      ),
      value: project._id,
    };
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: projectId ? projectId : "",
      status: TaskStatusEnum.PENDING,
      priority: TaskPriorityEnum.MEDIUM,
      assignees: [],
      tags: [],
      category: "",
      targetDate: defaultTargetDate,
      recurrencePreset: "NONE",
      recurrenceInterval: 1,
      recurrenceUnit: "day",
    },
  });

  const recurrencePreset = form.watch("recurrencePreset");

  useEffect(() => {
    if (defaultTargetDate) {
      form.setValue("targetDate", defaultTargetDate);
    }
  }, [defaultTargetDate, form]);

  const taskStatusList = Object.values(TaskStatusEnum);
  const taskPriorityList = Object.values(TaskPriorityEnum);

  const statusOptions = transformOptions(taskStatusList);
  const priorityOptions = transformOptions(taskPriorityList);

  const onSubmit = (values: FormValues) => {
    if (isPending) return;
    const { projectId: formProjectId, ...taskFields } = values;

    const payload = {
      workspaceId,
      projectId: formProjectId,
      data: {
        title: taskFields.title,
        description: taskFields.description || undefined,
        status: taskFields.status,
        priority: taskFields.priority,
        assignees: taskFields.assignees,
        targetDate: toIsoOrUndefined(taskFields.targetDate),
        startDate: toIsoOrUndefined(taskFields.startDate),
        tags: taskFields.tags,
        category: taskFields.category?.trim() || undefined,
        recurrence: formValuesToRecurrence(
          taskFields.recurrencePreset,
          taskFields.recurrenceInterval,
          taskFields.recurrenceUnit
        ),
      },
    };

    mutate(payload, {
      onSuccess: () => {
        invalidateTaskQueries(queryClient, {
          workspaceId,
          projectId: formProjectId,
        });

        toast({
          title: "Success",
          description: "Task created successfully",
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
          <h1
            className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1
           text-center sm:text-left"
          >
            Create Task
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Organize and manage tasks, resources, and team collaboration
          </p>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Task title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Website Redesign"
                        className="!h-[48px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Task description
                      <span className="text-xs font-extralight ml-2">
                        Optional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={1} placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!projectId && (
              <div>
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoading && (
                            <div className="my-2">
                              <Loader className="w-4 h-4 place-self-center flex animate-spin" />
                            </div>
                          )}
                          <div
                            className="w-full max-h-[200px]
                           overflow-y-auto scrollbar
                          "
                          >
                            {projectOptions?.map((option) => (
                              <SelectItem
                                key={option.value}
                                className="!capitalize cursor-pointer"
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
                            "w-full flex-1 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full flex-1 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          date > new Date("2100-12-31")
                        }
                        initialFocus
                        defaultMonth={field.value ?? new Date()}
                        fromMonth={new Date()}
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

            <div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            className="!text-muted-foreground !capitalize"
                            placeholder="Select a status"
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions?.map((status) => (
                          <SelectItem
                            className="!capitalize"
                            key={status.value}
                            value={status.value}
                          >
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions?.map((priority) => (
                          <SelectItem
                            className="!capitalize"
                            key={priority.value}
                            value={priority.value}
                          >
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              className="flex place-self-end  h-[40px] text-white font-semibold"
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader className="animate-spin" />}
              Create
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
