import { Router } from "express";
import {
  changeWorkspaceMemberRoleController,
  createWorkspaceController,
  deleteWorkspaceByIdController,
  getAllWorkspacesUserIsMemberController,
  getWorkspaceAnalyticsController,
  getWorkspaceByIdController,
  getWorkspaceMembersController,
  inviteMemberByEmailController,
  updateWorkspaceByIdController,
} from "../controllers/workspace.controller";
import { listWorkspaceActivitiesController } from "../controllers/task-activity.controller";

const workspaceRoutes = Router();

/**
 * @openapi
 * /workspace/create/new:
 *   post:
 *     tags: [Workspace]
 *     summary: Create a workspace
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkspaceRequest'
 *     responses:
 *       201:
 *         description: Workspace created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 workspace:
 *                   $ref: '#/components/schemas/Workspace'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
workspaceRoutes.post("/create/new", createWorkspaceController);

/**
 * @openapi
 * /workspace/update/{id}:
 *   put:
 *     tags: [Workspace]
 *     summary: Update a workspace
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWorkspaceRequest'
 *     responses:
 *       200:
 *         description: Workspace updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
workspaceRoutes.put("/update/:id", updateWorkspaceByIdController);

/**
 * @openapi
 * /workspace/change/member/role/{id}:
 *   put:
 *     tags: [Workspace]
 *     summary: Change a member's role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangeMemberRoleRequest'
 *     responses:
 *       200:
 *         description: Member role updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
workspaceRoutes.put(
  "/change/member/role/:id",
  changeWorkspaceMemberRoleController
);

/**
 * @openapi
 * /workspace/delete/{id}:
 *   delete:
 *     tags: [Workspace]
 *     summary: Delete a workspace
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
workspaceRoutes.delete("/delete/:id", deleteWorkspaceByIdController);

/**
 * @openapi
 * /workspace/all:
 *   get:
 *     tags: [Workspace]
 *     summary: List workspaces for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workspaces the user belongs to
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 workspaces:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Workspace'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
workspaceRoutes.get("/all", getAllWorkspacesUserIsMemberController);

/**
 * @openapi
 * /workspace/members/{id}:
 *   get:
 *     tags: [Workspace]
 *     summary: List workspace members and roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Members and available roles
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
workspaceRoutes.get("/members/:id", getWorkspaceMembersController);

/**
 * @openapi
 * /workspace/invite/{id}:
 *   post:
 *     tags: [Workspace]
 *     summary: Invite a member by email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InviteMemberRequest'
 *     responses:
 *       200:
 *         description: Invitation sent
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
workspaceRoutes.post("/invite/:id", inviteMemberByEmailController);

/**
 * @openapi
 * /workspace/analytics/{id}:
 *   get:
 *     tags: [Workspace]
 *     summary: Get workspace task analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Task counts (total, overdue, completed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 analytics:
 *                   $ref: '#/components/schemas/TaskAnalytics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
workspaceRoutes.get("/analytics/:id", getWorkspaceAnalyticsController);

/**
 * @openapi
 * /workspace/{workspaceId}/activity:
 *   get:
 *     tags: [Task Activities]
 *     summary: Get recent workspace activity feed
 *     description: Returns the 20 most recent task activity records across the workspace.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recent activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     activities:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WorkspaceActivity'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
workspaceRoutes.get(
  "/:workspaceId/activity",
  listWorkspaceActivitiesController
);

/**
 * @openapi
 * /workspace/{id}:
 *   get:
 *     tags: [Workspace]
 *     summary: Get workspace by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 workspace:
 *                   $ref: '#/components/schemas/Workspace'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
workspaceRoutes.get("/:id", getWorkspaceByIdController);

export default workspaceRoutes;
