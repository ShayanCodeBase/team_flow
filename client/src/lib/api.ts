import API from "./axios-client";
import { clearAccessToken, getAccessToken, setAccessToken } from "./auth-token";
import {
  metaToPagination,
  unwrapApiData,
  unwrapApiDataWithMeta,
  type ApiSuccessEnvelope,
} from "./api-response";
import {
  AllMembersInWorkspaceResponseType,
  AllProjectPayloadType,
  AllProjectResponseType,
  AllTaskPayloadType,
  AllTaskResponseType,
  AnalyticsResponseType,
  ChangeWorkspaceMemberRoleType,
  CommentsListResult,
  CreateCommentResult,
  CreateProjectPayloadType,
  CreateSubtaskPayloadType,
  CreateTaskPayloadType,
  CreateTaskResult,
  EditProjectPayloadType,
  EditTaskPayloadType,
  EditTaskResult,
  MoveTaskPayloadType,
  MoveTaskResult,
  ProjectByIdPayloadType,
  ProjectResponseType,
  TaskListResult,
  CreateWorkspaceResponseType,
  UpdateCommentResult,
  NotificationsListResult,
  NotificationType,
  UnreadNotificationCountResult,
  TaskActivitiesListResult,
  WorkspaceActivitiesResult,
} from "../types/api.type";
import {
  AllWorkspaceResponseType,
  CreateWorkspaceType,
  CurrentUserResponseType,
  LoginResponseType,
  loginType,
  registerType,
  WorkspaceByIdResponseType,
  EditWorkspaceType,
} from "@/types/api.type";

export const refreshAccessTokenFn = async (): Promise<string> => {
  const response = await API.post<
    ApiSuccessEnvelope<{ accessToken: string }>
  >("/auth/refresh");
  const { accessToken } = unwrapApiData(response.data);
  setAccessToken(accessToken);
  return accessToken;
};

/** Restore access token from httpOnly refresh cookie (e.g. after page reload). */
export const initializeAuthSession = async (): Promise<void> => {
  if (getAccessToken()) return;
  try {
    await refreshAccessTokenFn();
  } catch {
    // No valid refresh cookie — user stays logged out
  }
};

export const loginMutationFn = async (
  data: loginType
): Promise<LoginResponseType> => {
  const response = await API.post<
    ApiSuccessEnvelope<{ accessToken: string; user: LoginResponseType["user"] }>
  >("/auth/login", data);
  const { accessToken, user } = unwrapApiData(response.data);
  setAccessToken(accessToken);
  return { user };
};

export const registerMutationFn = async (data: registerType) =>
  await API.post("/auth/register", data);

export const forgotPasswordMutationFn = async (data: { email: string }) => {
  const response = await API.post<ApiSuccessEnvelope<{ message: string }>>(
    "/auth/forgot-password",
    data
  );
  return unwrapApiData(response.data);
};

export const resetPasswordMutationFn = async (data: {
  token: string;
  password: string;
}) => {
  const response = await API.post<ApiSuccessEnvelope<{ message: string }>>(
    "/auth/reset-password",
    data
  );
  return unwrapApiData(response.data);
};

export const inviteMemberByEmailMutationFn = async ({
  workspaceId,
  email,
}: {
  workspaceId: string;
  email: string;
}) => {
  const response = await API.post<ApiSuccessEnvelope<{ message: string }>>(
    `/workspace/invite/${workspaceId}`,
    { email }
  );
  return unwrapApiData(response.data);
};

export const logoutMutationFn = async () => {
  await API.post("/auth/logout");
  clearAccessToken();
};

export const getCurrentUserQueryFn =
  async (): Promise<CurrentUserResponseType> => {
    const response = await API.get(`/user/current`);
    return response.data;
  };

//********* WORKSPACE ****************
//************* */

export const createWorkspaceMutationFn = async (
  data: CreateWorkspaceType
): Promise<CreateWorkspaceResponseType> => {
  const response = await API.post(`/workspace/create/new`, data);
  return response.data;
};

export const editWorkspaceMutationFn = async ({
  workspaceId,
  data,
}: EditWorkspaceType) => {
  const response = await API.put(`/workspace/update/${workspaceId}`, data);
  return response.data;
};

export const getAllWorkspacesUserIsMemberQueryFn =
  async (): Promise<AllWorkspaceResponseType> => {
    const response = await API.get(`/workspace/all`);
    return response.data;
  };

export const getWorkspaceByIdQueryFn = async (
  workspaceId: string
): Promise<WorkspaceByIdResponseType> => {
  const response = await API.get(`/workspace/${workspaceId}`);
  return response.data;
};

export const getMembersInWorkspaceQueryFn = async (
  workspaceId: string
): Promise<AllMembersInWorkspaceResponseType> => {
  const response = await API.get(`/workspace/members/${workspaceId}`);
  return response.data;
};

export const getWorkspaceAnalyticsQueryFn = async (
  workspaceId: string
): Promise<AnalyticsResponseType> => {
  const response = await API.get(`/workspace/analytics/${workspaceId}`);
  return response.data;
};

export const getWorkspaceActivitiesQueryFn = async (
  workspaceId: string
): Promise<WorkspaceActivitiesResult> => {
  const response = await API.get<
    ApiSuccessEnvelope<WorkspaceActivitiesResult>
  >(`/workspace/${workspaceId}/activity`);
  return unwrapApiData(response.data);
};

export const changeWorkspaceMemberRoleMutationFn = async ({
  workspaceId,
  data,
}: ChangeWorkspaceMemberRoleType) => {
  const response = await API.put(
    `/workspace/change/member/role/${workspaceId}`,
    data
  );
  return response.data;
};

export const deleteWorkspaceMutationFn = async (
  workspaceId: string
): Promise<{
  message: string;
  currentWorkspace: string;
}> => {
  const response = await API.delete(`/workspace/delete/${workspaceId}`);
  return response.data;
};

//*******MEMBER ****************

export const invitedUserJoinWorkspaceMutationFn = async (
  iniviteCode: string
): Promise<{
  message: string;
  workspaceId: string;
}> => {
  const response = await API.post(`/member/workspace/${iniviteCode}/join`);
  return response.data;
};

//********* */
//********* PROJECTS
export const createProjectMutationFn = async ({
  workspaceId,
  data,
}: CreateProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.post(
    `/project/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const editProjectMutationFn = async ({
  projectId,
  workspaceId,
  data,
}: EditProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.put(
    `/project/${projectId}/workspace/${workspaceId}/update`,
    data
  );
  return response.data;
};

export const getProjectsInWorkspaceQueryFn = async ({
  workspaceId,
  pageSize = 10,
  pageNumber = 1,
}: AllProjectPayloadType): Promise<AllProjectResponseType> => {
  const response = await API.get(
    `/project/workspace/${workspaceId}/all?pageSize=${pageSize}&pageNumber=${pageNumber}`
  );
  return response.data;
};

export const getProjectByIdQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}`
  );
  return response.data;
};

export const getProjectAnalyticsQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<AnalyticsResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/analytics`
  );
  return response.data;
};

export const deleteProjectMutationFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/project/${projectId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

//*******TASKS ********************************
//************************* */

export const createTaskMutationFn = async ({
  workspaceId,
  projectId,
  data,
}: CreateTaskPayloadType): Promise<CreateTaskResult> => {
  const response = await API.post<ApiSuccessEnvelope<CreateTaskResult>>(
    `/task/project/${projectId}/workspace/${workspaceId}/create`,
    data
  );
  return unwrapApiData(response.data);
};

export const editTaskMutationFn = async ({
  taskId,
  projectId,
  workspaceId,
  data,
}: EditTaskPayloadType): Promise<EditTaskResult> => {
  const response = await API.put<ApiSuccessEnvelope<EditTaskResult>>(
    `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/update`,
    data
  );
  return unwrapApiData(response.data);
};

export const getAllTasksQueryFn = async ({
  workspaceId,
  keyword,
  projectId,
  assignedTo,
  priority,
  status,
  dueDate,
  dueBefore,
  dueAfter,
  pageNumber,
  pageSize,
  rootOnly,
  sortBy,
  sortOrder,
}: AllTaskPayloadType): Promise<AllTaskResponseType> => {
  const baseUrl = `/task/workspace/${workspaceId}/all`;

  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (projectId) queryParams.append("projectId", projectId);
  if (assignedTo) queryParams.append("assignedTo", assignedTo);
  if (priority) queryParams.append("priority", priority);
  if (status) queryParams.append("status", status);
  if (dueDate) queryParams.append("dueDate", dueDate);
  if (dueBefore) queryParams.append("dueBefore", dueBefore);
  if (dueAfter) queryParams.append("dueAfter", dueAfter);
  if (pageNumber) queryParams.append("pageNumber", pageNumber.toString());
  if (pageSize) queryParams.append("pageSize", pageSize.toString());
  if (rootOnly) queryParams.append("rootOnly", "true");
  if (sortBy) queryParams.append("sortBy", sortBy);
  if (sortOrder) queryParams.append("sortOrder", sortOrder);

  const url = queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;
  const response = await API.get<
    ApiSuccessEnvelope<{ tasks: AllTaskResponseType["tasks"] }>
  >(url);

  const { data, meta } = unwrapApiDataWithMeta(response.data);

  return {
    tasks: data.tasks,
    pagination: meta
      ? metaToPagination(meta)
      : {
          pageNumber: pageNumber ?? 1,
          pageSize: pageSize ?? 10,
          totalCount: data.tasks.length,
          totalPages: 1,
          skip: 0,
          limit: pageSize ?? 10,
        },
  };
};

export const deleteTaskMutationFn = async ({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}): Promise<{ deleted: true }> => {
  const response = await API.delete<ApiSuccessEnvelope<{ deleted: true }>>(
    `/task/${taskId}/workspace/${workspaceId}/delete`
  );
  return unwrapApiData(response.data);
};

export const createSubtaskMutationFn = async ({
  workspaceId,
  projectId,
  parentTaskId,
  data,
}: CreateSubtaskPayloadType): Promise<CreateTaskResult> => {
  const response = await API.post<ApiSuccessEnvelope<CreateTaskResult>>(
    `/task/${parentTaskId}/project/${projectId}/workspace/${workspaceId}/subtask`,
    data
  );
  return unwrapApiData(response.data);
};

export const getTaskChildrenQueryFn = async ({
  workspaceId,
  projectId,
  taskId,
}: {
  workspaceId: string;
  projectId: string;
  taskId: string;
}): Promise<TaskListResult> => {
  const response = await API.get<ApiSuccessEnvelope<TaskListResult>>(
    `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/children`
  );
  return unwrapApiData(response.data);
};

export const getTaskSubtreeQueryFn = async ({
  workspaceId,
  projectId,
  taskId,
}: {
  workspaceId: string;
  projectId: string;
  taskId: string;
}): Promise<TaskListResult> => {
  const response = await API.get<ApiSuccessEnvelope<TaskListResult>>(
    `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/subtree`
  );
  return unwrapApiData(response.data);
};

export const moveTaskMutationFn = async ({
  workspaceId,
  projectId,
  taskId,
  newParentId,
}: MoveTaskPayloadType): Promise<MoveTaskResult> => {
  const response = await API.put<ApiSuccessEnvelope<MoveTaskResult>>(
    `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/move`,
    { newParentId }
  );
  return unwrapApiData(response.data);
};

//*******COMMENTS ********************************

export const getComments = async (
  taskId: string,
  workspaceId: string,
  page = 1,
  pageSize = 20
): Promise<CommentsListResult> => {
  const response = await API.get<
    ApiSuccessEnvelope<{ comments: CommentsListResult["comments"] }>
  >(
    `/task/${taskId}/workspace/${workspaceId}/comments?pageNumber=${page}&pageSize=${pageSize}`
  );

  const { data, meta } = unwrapApiDataWithMeta(response.data);

  return {
    comments: data.comments,
    pagination: meta
      ? metaToPagination(meta)
      : {
          pageNumber: page,
          pageSize,
          totalCount: data.comments.length,
          totalPages: 1,
          skip: 0,
          limit: pageSize,
        },
  };
};

export const createComment = async (
  taskId: string,
  workspaceId: string,
  content: string
): Promise<CreateCommentResult> => {
  const response = await API.post<ApiSuccessEnvelope<CreateCommentResult>>(
    `/task/${taskId}/workspace/${workspaceId}/comments`,
    { content }
  );
  return unwrapApiData(response.data);
};

export const updateComment = async (
  taskId: string,
  workspaceId: string,
  commentId: string,
  content: string
): Promise<UpdateCommentResult> => {
  const response = await API.patch<ApiSuccessEnvelope<UpdateCommentResult>>(
    `/task/${taskId}/workspace/${workspaceId}/comments/${commentId}`,
    { content }
  );
  return unwrapApiData(response.data);
};

export const deleteComment = async (
  taskId: string,
  workspaceId: string,
  commentId: string
): Promise<{ deleted: true }> => {
  const response = await API.delete<ApiSuccessEnvelope<{ deleted: true }>>(
    `/task/${taskId}/workspace/${workspaceId}/comments/${commentId}`
  );
  return unwrapApiData(response.data);
};

//*******NOTIFICATIONS ********************************

export const getUnreadNotificationCount =
  async (): Promise<UnreadNotificationCountResult> => {
    const response = await API.get<
      ApiSuccessEnvelope<UnreadNotificationCountResult>
    >("/notifications/unread-count");
    return unwrapApiData(response.data);
  };

export const getNotifications = async (
  page = 1,
  pageSize = 20
): Promise<NotificationsListResult> => {
  const response = await API.get<
    ApiSuccessEnvelope<{ notifications: NotificationType[] }>
  >(`/notifications?pageNumber=${page}&pageSize=${pageSize}`);

  const { data, meta } = unwrapApiDataWithMeta(response.data);

  return {
    notifications: data.notifications,
    pagination: meta
      ? metaToPagination(meta)
      : {
          pageNumber: page,
          pageSize,
          totalCount: data.notifications.length,
          totalPages: 1,
          skip: 0,
          limit: pageSize,
        },
  };
};

export const markNotificationRead = async (
  notificationId: string
): Promise<{ notification: NotificationType }> => {
  const response = await API.patch<
    ApiSuccessEnvelope<{ notification: NotificationType }>
  >(`/notifications/${notificationId}/read`);
  return unwrapApiData(response.data);
};

export const markAllNotificationsRead = async (): Promise<{ count: number }> => {
  const response = await API.patch<ApiSuccessEnvelope<{ count: number }>>(
    "/notifications/read-all"
  );
  return unwrapApiData(response.data);
};

//*******TASK ACTIVITIES ********************************

export const getTaskActivities = async (
  taskId: string,
  workspaceId: string,
  page = 1,
  pageSize = 20
): Promise<TaskActivitiesListResult> => {
  const response = await API.get<
    ApiSuccessEnvelope<{ activities: TaskActivitiesListResult["activities"] }>
  >(
    `/task/${taskId}/workspace/${workspaceId}/activities?pageNumber=${page}&pageSize=${pageSize}`
  );

  const { data, meta } = unwrapApiDataWithMeta(response.data);

  return {
    activities: data.activities,
    pagination: meta
      ? metaToPagination(meta)
      : {
          pageNumber: page,
          pageSize,
          totalCount: data.activities.length,
          totalPages: 1,
          skip: 0,
          limit: pageSize,
        },
  };
};
