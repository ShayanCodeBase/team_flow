import {
  PermissionType,
  TaskPriorityEnumType,
  TaskStatusEnumType,
} from "@/constant";

export type loginType = { email: string; password: string };
export type LoginResponseType = {
  user: UserType;
};

export type registerType = {
  name: string;
  email: string;
  password: string;
};

// USER TYPE
export type UserType = {
  _id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  isActive: true;
  lastLogin: null;
  createdAt: Date;
  updatedAt: Date;
  currentWorkspace: {
    _id: string;
    name: string;
    owner: string;
    inviteCode: string;
  };
};

export type CurrentUserResponseType = {
  message: string;
  user: UserType;
};

//******** */ WORLSPACE TYPES ****************
// ******************************************
export type WorkspaceType = {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  inviteCode: string;
};

export type CreateWorkspaceType = {
  name: string;
  description: string;
};

export type EditWorkspaceType = {
  workspaceId: string;
  data: {
    name: string;
    description: string;
  };
};

export type CreateWorkspaceResponseType = {
  message: string;
  workspace: WorkspaceType;
};

export type AllWorkspaceResponseType = {
  message: string;
  workspaces: WorkspaceType[];
};

export type WorkspaceWithMembersType = WorkspaceType & {
  members: {
    _id: string;
    userId: string;
    workspaceId: string;
    role: {
      _id: string;
      name: string;
      permissions: PermissionType[];
    };
    joinedAt: string;
    createdAt: string;
  }[];
};

export type WorkspaceByIdResponseType = {
  message: string;
  workspace: WorkspaceWithMembersType;
};

export type ChangeWorkspaceMemberRoleType = {
  workspaceId: string;
  data: {
    roleId: string;
    memberId: string;
  };
};

export type AllMembersInWorkspaceResponseType = {
  message: string;
  members: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      profilePicture: string | null;
    };
    workspaceId: string;
    role: {
      _id: string;
      name: string;
    };
    joinedAt: string;
    createdAt: string;
  }[];
  roles: RoleType[];
};

export type AnalyticsResponseType = {
  message: string;
  analytics: {
    totalTasks: number;
    overdueTasks: number;
    completedTasks: number;
  };
};

export type PaginationType = {
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  skip: number;
  limit: number;
};

export type RoleType = {
  _id: string;
  name: string;
};
// *********** MEMBER ****************

//******** */ PROJECT TYPES ****************
//****************************************** */
export type ProjectType = {
  _id: string;
  name: string;
  emoji: string;
  description: string;
  workspace: string;
  createdBy: {
    _id: string;
    name: string;
    profilePicture: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectPayloadType = {
  workspaceId: string;
  data: {
    emoji: string;
    name: string;
    description: string;
  };
};

export type ProjectResponseType = {
  message: "Project created successfully";
  project: ProjectType;
};

export type EditProjectPayloadType = {
  workspaceId: string;
  projectId: string;
  data: {
    emoji: string;
    name: string;
    description: string;
  };
};

//ALL PROJECTS IN WORKSPACE TYPE
export type AllProjectPayloadType = {
  workspaceId: string;
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  skip?: boolean;
};

export type AllProjectResponseType = {
  message: string;
  projects: ProjectType[];
  pagination: PaginationType;
};

// SINGLE PROJECT IN WORKSPACE TYPE
export type ProjectByIdPayloadType = {
  workspaceId: string;
  projectId: string;
};

//********** */ TASK TYPES ************************
//************************************************* */

export type TaskUserType = {
  _id: string;
  name: string;
  profilePicture: string | null;
};

export type TaskWriteData = {
  title: string;
  description?: string;
  priority: TaskPriorityEnumType;
  status: TaskStatusEnumType;
  assignees?: string[];
  startDate?: string;
  targetDate?: string;
  startedOn?: string;
  completedOn?: string;
  tags?: string[];
  category?: string;
  recurrence?: Record<string, unknown> | null;
  parentTaskId?: string | null;
};

export type CreateTaskPayloadType = {
  workspaceId: string;
  projectId: string;
  data: TaskWriteData;
};

export type CreateSubtaskPayloadType = {
  workspaceId: string;
  projectId: string;
  parentTaskId: string;
  data: Omit<TaskWriteData, "parentTaskId">;
};

export type MoveTaskPayloadType = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  newParentId: string | null;
};

export type EditTaskPayloadType = {
  taskId: string;
  workspaceId: string;
  projectId: string;
  data: Partial<TaskWriteData>;
};

export type TaskType = {
  _id: string;
  taskCode: string;
  title: string;
  description: string | null;
  status: TaskStatusEnumType;
  priority: TaskPriorityEnumType;
  startDate: string | null;
  targetDate: string | null;
  startedOn: string | null;
  completedOn: string | null;
  tags: string[];
  category: string | null;
  recurrence: Record<string, unknown> | null;
  parentTaskId: string | null;
  treePath: string | null;
  level: number;
  workspaceId: string;
  projectId: string;
  project?: {
    _id: string;
    emoji: string;
    name: string;
  };
  createdById: string;
  updatedById: string | null;
  assignees: TaskUserType[];
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskListResult = {
  tasks: TaskType[];
};

export type AllTaskPayloadType = {
  workspaceId: string;
  projectId?: string | null;
  keyword?: string | null;
  priority?: TaskPriorityEnumType | string | null;
  status?: TaskStatusEnumType | string | null;
  assignedTo?: string | null;
  dueDate?: string | null;
  dueBefore?: string | null;
  dueAfter?: string | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  rootOnly?: boolean;
  sortBy?:
    | "title"
    | "status"
    | "priority"
    | "targetDate"
    | "startDate"
    | "createdAt"
    | "updatedAt"
    | null;
  sortOrder?: "asc" | "desc" | null;
};

export type AllTaskResponseType = {
  tasks: TaskType[];
  pagination: PaginationType;
};

export type CreateTaskResult = {
  task: TaskType;
};

export type EditTaskResult = {
  task: TaskType;
};

export type MoveTaskResult = {
  task: TaskType;
};

//********** */ COMMENT TYPES ************************

export type CommentType = {
  _id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: TaskUserType;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommentsListResult = {
  comments: CommentType[];
  pagination: PaginationType;
};

export type CreateCommentResult = {
  comment: CommentType;
};

export type UpdateCommentResult = {
  comment: CommentType;
};

//********** */ NOTIFICATION TYPES ************************

export type NotificationTypeValue =
  | "TASK_ASSIGNED"
  | "COMMENT_ADDED"
  | "TASK_OVERDUE";

export type NotificationMetadata = {
  taskId?: string;
  workspaceId?: string;
  commentId?: string;
};

export type NotificationType = {
  _id: string;
  userId: string;
  type: NotificationTypeValue;
  title: string;
  message: string;
  isRead: boolean;
  metadata: NotificationMetadata | Record<string, unknown> | null;
  createdAt: string;
};

export type NotificationsListResult = {
  notifications: NotificationType[];
  pagination: PaginationType;
};

export type UnreadNotificationCountResult = {
  count: number;
};

//********** */ TASK ACTIVITY TYPES ************************

export type TaskActivityActionType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "ASSIGNEE_ADDED"
  | "ASSIGNEE_REMOVED"
  | "COMMENT_ADDED"
  | "COMMENT_UPDATED"
  | "COMMENT_DELETED"
  | "DUE_DATE_CHANGED"
  | "TASK_MOVED"
  | "TASK_DELETED";

export type TaskActivityType = {
  _id: string;
  taskId: string;
  action: TaskActivityActionType | string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: TaskUserType;
};

export type TaskActivitiesListResult = {
  activities: TaskActivityType[];
  pagination: PaginationType;
};

export type WorkspaceActivityType = TaskActivityType & {
  task: {
    _id: string;
    title: string;
  };
};

export type WorkspaceActivitiesResult = {
  activities: WorkspaceActivityType[];
};
