/** Mirrors backend Prisma `TaskStatus` enum. */
export const TaskStatusEnum = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  OVERDUE: "OVERDUE",
  ON_HOLD: "ON_HOLD",
  CRITICAL: "CRITICAL",
  CANCELLED: "CANCELLED",
} as const;

/** Mirrors backend Prisma `TaskPriority` enum. */
export const TaskPriorityEnum = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export type TaskStatusEnumType =
  (typeof TaskStatusEnum)[keyof typeof TaskStatusEnum];

export type TaskPriorityEnumType =
  (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum];

export const TASK_STATUS_VALUES = Object.values(TaskStatusEnum) as [
  TaskStatusEnumType,
  ...TaskStatusEnumType[],
];

export const TASK_PRIORITY_VALUES = Object.values(TaskPriorityEnum) as [
  TaskPriorityEnumType,
  ...TaskPriorityEnumType[],
];

export type TaskStatusConfig = {
  label: string;
  badgeClass: string;
  strikethrough?: boolean;
};

export type TaskPriorityConfig = {
  label: string;
  badgeClass: string;
};

/** Display labels and Tailwind classes per spec color codes. */
export const TASK_STATUS_CONFIG: Record<TaskStatusEnumType, TaskStatusConfig> =
  {
    PENDING: {
      label: "Pending",
      badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
    },
    IN_PROGRESS: {
      label: "In Progress",
      badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    },
    DONE: {
      label: "Done",
      badgeClass: "bg-green-100 text-green-800 border-green-200",
    },
    OVERDUE: {
      label: "Overdue",
      badgeClass: "bg-red-100 text-red-800 border-red-200",
    },
    ON_HOLD: {
      label: "On Hold",
      badgeClass: "bg-yellow-100 text-yellow-900 border-yellow-200",
    },
    CRITICAL: {
      label: "Critical",
      badgeClass: "bg-red-900 text-red-50 border-red-950",
    },
    CANCELLED: {
      label: "Cancelled",
      badgeClass: "bg-muted text-muted-foreground border-muted line-through",
      strikethrough: true,
    },
  };

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriorityEnumType,
  TaskPriorityConfig
> = {
  LOW: {
    label: "Low",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  CRITICAL: {
    label: "Critical",
    badgeClass: "bg-red-900 text-red-50 border-red-950",
  },
};

export const Permissions = {
  CREATE_WORKSPACE: "CREATE_WORKSPACE",
  DELETE_WORKSPACE: "DELETE_WORKSPACE",
  EDIT_WORKSPACE: "EDIT_WORKSPACE",
  MANAGE_WORKSPACE_SETTINGS: "MANAGE_WORKSPACE_SETTINGS",
  ADD_MEMBER: "ADD_MEMBER",
  CHANGE_MEMBER_ROLE: "CHANGE_MEMBER_ROLE",
  REMOVE_MEMBER: "REMOVE_MEMBER",
  CREATE_PROJECT: "CREATE_PROJECT",
  EDIT_PROJECT: "EDIT_PROJECT",
  DELETE_PROJECT: "DELETE_PROJECT",
  CREATE_TASK: "CREATE_TASK",
  EDIT_TASK: "EDIT_TASK",
  DELETE_TASK: "DELETE_TASK",
  VIEW_ONLY: "VIEW_ONLY",
} as const;

export type PermissionType = keyof typeof Permissions;
