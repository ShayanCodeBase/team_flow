import { Router } from "express";
import { joinWorkspaceController } from "../controllers/member.controller";

const memberRoutes = Router();

/**
 * @openapi
 * /member/workspace/{inviteCode}/join:
 *   post:
 *     tags: [Member]
 *     summary: Join a workspace via invite code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace invite code from the invite link
 *     responses:
 *       200:
 *         description: Joined workspace successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 workspaceId:
 *                   type: string
 *                   format: uuid
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
memberRoutes.post("/workspace/:inviteCode/join", joinWorkspaceController);

export default memberRoutes;
