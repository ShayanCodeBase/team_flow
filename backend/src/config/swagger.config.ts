import path from "path";
import swaggerJsdoc, { Options } from "swagger-jsdoc";

export const SWAGGER_UI_PATH = "/api/docs";

const routesGlob = path.join(__dirname, "..", "routes", "*.route.ts");
const routesGlobJs = path.join(__dirname, "..", "routes", "*.route.js");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Team Flow API",
    version: "1.0.0",
    description:
      "Project management API with workspaces, projects, tasks, comments, notifications and activity logs",
  },
  servers: [
    {
      url: "/api",
      description: "API base path",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication and account recovery" },
    { name: "User", description: "Current user profile" },
    { name: "Workspace", description: "Workspace management and analytics" },
    { name: "Member", description: "Workspace membership" },
    { name: "Project", description: "Projects within a workspace" },
    { name: "Task", description: "Tasks, subtasks, and hierarchy" },
    { name: "Comments", description: "Task comments" },
    { name: "Notifications", description: "User notifications" },
    { name: "Task Activities", description: "Task and workspace activity logs" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "JWT access token from login or refresh. Example: Bearer eyJhbGciOiJIUzI1NiIs...",
      },
    },
    schemas: {
      ApiErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "object",
            additionalProperties: { type: "string" },
          },
          errorCode: { type: "string", example: "AUTH_UNAUTHORIZED_ACCESS" },
        },
        required: ["success", "message"],
      },
      ApiPaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 20 },
          total: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 3 },
        },
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
        required: ["message"],
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 4 },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 4 },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string" },
          password: { type: "string", minLength: 4 },
        },
      },
      UserPublic: {
        type: "object",
        properties: {
          _id: { type: "string", format: "uuid" },
          name: { type: "string", nullable: true },
          email: { type: "string", format: "email" },
          profilePicture: { type: "string", nullable: true },
        },
      },
      CurrentWorkspace: {
        type: "object",
        properties: {
          _id: { type: "string", format: "uuid" },
          name: { type: "string" },
          owner: { type: "string", format: "uuid" },
          inviteCode: { type: "string" },
        },
      },
      LoginSuccessData: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          user: { $ref: "#/components/schemas/UserWithWorkspace" },
        },
      },
      LoginSuccessEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/LoginSuccessData" },
        },
      },
      RefreshSuccessEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string" },
            },
          },
        },
      },
      UserWithWorkspace: {
        allOf: [
          { $ref: "#/components/schemas/UserPublic" },
          {
            type: "object",
            properties: {
              currentWorkspace: {
                $ref: "#/components/schemas/CurrentWorkspace",
              },
            },
          },
        ],
      },
      CurrentUserResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          user: { $ref: "#/components/schemas/UserWithWorkspace" },
        },
      },
      Workspace: {
        type: "object",
        properties: {
          _id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          owner: { type: "string", format: "uuid" },
          inviteCode: { type: "string" },
        },
      },
      CreateWorkspaceRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string" },
        },
      },
      UpdateWorkspaceRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string" },
        },
      },
      InviteMemberRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      ChangeMemberRoleRequest: {
        type: "object",
        required: ["memberId", "roleId"],
        properties: {
          memberId: { type: "string" },
          roleId: { type: "string", format: "uuid" },
        },
      },
      TaskAnalytics: {
        type: "object",
        properties: {
          totalTasks: { type: "integer" },
          overdueTasks: { type: "integer" },
          completedTasks: { type: "integer" },
        },
      },
      Project: {
        type: "object",
        properties: {
          _id: { type: "string", format: "uuid" },
          name: { type: "string" },
          emoji: { type: "string" },
          description: { type: "string", nullable: true },
          workspaceId: { type: "string", format: "uuid" },
        },
      },
      CreateProjectRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          emoji: { type: "string" },
          description: { type: "string" },
        },
      },
      UpdateProjectRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255 },
          emoji: { type: "string" },
          description: { type: "string" },
        },
      },
      TaskStatus: {
        type: "string",
        enum: [
          "PENDING",
          "IN_PROGRESS",
          "DONE",
          "OVERDUE",
          "ON_HOLD",
          "CRITICAL",
          "CANCELLED",
        ],
      },
      TaskPriority: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      },
      Task: {
        type: "object",
        properties: {
          _id: { type: "string", format: "uuid" },
          taskCode: { type: "string" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          status: { $ref: "#/components/schemas/TaskStatus" },
          priority: { $ref: "#/components/schemas/TaskPriority" },
          startDate: { type: "string", format: "date-time", nullable: true },
          targetDate: { type: "string", format: "date-time", nullable: true },
          startedOn: { type: "string", format: "date-time", nullable: true },
          completedOn: { type: "string", format: "date-time", nullable: true },
          tags: { type: "array", items: { type: "string" } },
          category: { type: "string", nullable: true },
          recurrence: { type: "object", nullable: true },
          parentTaskId: { type: "string", format: "uuid", nullable: true },
          workspaceId: { type: "string", format: "uuid" },
          projectId: { type: "string", format: "uuid" },
          assignees: {
            type: "array",
            items: { $ref: "#/components/schemas/UserPublic" },
          },
          project: { $ref: "#/components/schemas/Project" },
        },
      },
      CreateTaskRequest: {
        type: "object",
        required: ["title", "priority", "status"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string" },
          priority: { $ref: "#/components/schemas/TaskPriority" },
          status: { $ref: "#/components/schemas/TaskStatus" },
          assignees: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
          startDate: { type: "string", format: "date-time" },
          targetDate: { type: "string", format: "date-time" },
          tags: { type: "array", items: { type: "string" } },
          category: { type: "string" },
          recurrence: { type: "object", nullable: true },
        },
      },
      UpdateTaskRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string" },
          priority: { $ref: "#/components/schemas/TaskPriority" },
          status: { $ref: "#/components/schemas/TaskStatus" },
          assignees: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
          startDate: { type: "string", format: "date-time" },
          targetDate: { type: "string", format: "date-time" },
          tags: { type: "array", items: { type: "string" } },
          category: { type: "string" },
          recurrence: { type: "object", nullable: true },
        },
      },
      MoveTaskRequest: {
        type: "object",
        required: ["newParentId"],
        properties: {
          newParentId: {
            type: "string",
            format: "uuid",
            nullable: true,
            description: "Parent task UUID, or null for root level",
          },
        },
      },
      Comment: {
        type: "object",
        properties: {
          _id: { type: "string", format: "uuid" },
          content: { type: "string" },
          taskId: { type: "string", format: "uuid" },
          author: { $ref: "#/components/schemas/UserPublic" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateCommentRequest: {
        type: "object",
        required: ["content"],
        properties: {
          content: { type: "string", minLength: 1, maxLength: 2000 },
        },
      },
      UpdateCommentRequest: {
        type: "object",
        required: ["content"],
        properties: {
          content: { type: "string", minLength: 1, maxLength: 2000 },
        },
      },
      Notification: {
        type: "object",
        properties: {
          _id: { type: "string", format: "uuid" },
          type: { type: "string" },
          title: { type: "string" },
          message: { type: "string" },
          isRead: { type: "boolean" },
          metadata: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TaskActivity: {
        type: "object",
        properties: {
          _id: { type: "string", format: "uuid" },
          taskId: { type: "string", format: "uuid" },
          action: { type: "string" },
          metadata: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          user: { $ref: "#/components/schemas/UserPublic" },
        },
      },
      WorkspaceActivity: {
        allOf: [
          { $ref: "#/components/schemas/TaskActivity" },
          {
            type: "object",
            properties: {
              task: {
                type: "object",
                properties: {
                  _id: { type: "string", format: "uuid" },
                  title: { type: "string" },
                },
              },
            },
          },
        ],
      },
    },
    responses: {
      Unauthorized: {
        description: "Missing or invalid Bearer token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiErrorResponse" },
          },
        },
      },
      Forbidden: {
        description: "Insufficient workspace permissions",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiErrorResponse" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiErrorResponse" },
          },
        },
      },
      BadRequest: {
        description: "Validation or business rule error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiErrorResponse" },
          },
        },
      },
    },
  },
};

const options: Options = {
  definition: swaggerDefinition,
  apis: [routesGlob, routesGlobJs],
};

export const swaggerSpec = swaggerJsdoc(options);
