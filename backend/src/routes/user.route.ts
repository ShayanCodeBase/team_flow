import { Router } from "express";
import { getCurrentUserController } from "../controllers/user.controller";

const userRoutes = Router();

/**
 * @openapi
 * /user/current:
 *   get:
 *     tags: [User]
 *     summary: Get the authenticated user
 *     description: Returns the current user profile and active workspace. Requires Bearer JWT.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentUserResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
userRoutes.get("/current", getCurrentUserController);

export default userRoutes;
