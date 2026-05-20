import { Roles } from "../enums/role.enum";
import {
  memberRepository,
  userRepository,
  workspaceRepository,
  taskRepository,
} from "../db/repositories";
import { BadRequestException, NotFoundException } from "../utils/appError";
import { APP_BRAND_NAME } from "../config/email.config";
import { sendEmail } from "./email.service";

export const createWorkspaceService = async (
  userId: string,
  body: {
    name: string;
    description?: string | undefined;
  }
) => {
  const { name, description } = body;

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const ownerRole = await memberRepository.findRoleByName(Roles.OWNER);

  if (!ownerRole) {
    throw new NotFoundException("Owner role not found");
  }

  const workspace = await workspaceRepository.create({
    name,
    description,
    ownerId: userId,
  });

  const workspaceId = String(workspace._id);

  await memberRepository.create({
    userId,
    workspaceId,
    roleId: String(ownerRole._id),
    joinedAt: new Date(),
  });

  await userRepository.setCurrentWorkspace(userId, workspaceId);

  return { workspace };
};

export const getAllWorkspacesUserIsMemberService = async (userId: string) => {
  const memberships = await memberRepository.findUserMemberships(userId);

  const workspaces = memberships.map(
    (membership: { workspaceId: unknown }) => membership.workspaceId
  );

  return { workspaces };
};

export const getWorkspaceByIdService = async (workspaceId: string) => {
  const workspace = await workspaceRepository.findByIdWithMembers(workspaceId);

  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  return { workspace };
};

export const getWorkspaceMembersService = async (workspaceId: string) => {
  const [members, roles] = await Promise.all([
    memberRepository.findWorkspaceMembersPopulated(workspaceId),
    memberRepository.findAllRoles(),
  ]);

  return { members, roles };
};

export const getWorkspaceAnalyticsService = async (workspaceId: string) => {
  const analytics = await taskRepository.countWorkspaceAnalytics(workspaceId);
  return { analytics };
};

export const changeMemberRoleService = async (
  workspaceId: string,
  memberId: string,
  roleId: string
) => {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const role = await memberRepository.findRoleById(roleId);
  if (!role) {
    throw new NotFoundException("Role not found");
  }

  const member = await memberRepository.updateRoleByUserAndWorkspace(
    memberId,
    workspaceId,
    roleId
  );

  if (!member) {
    throw new Error("Member not found in the workspace");
  }

  return { member };
};

export const updateWorkspaceByIdService = async (
  workspaceId: string,
  name: string,
  description?: string
) => {
  const workspace = await workspaceRepository.update(workspaceId, {
    name,
    description,
  });

  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  return { workspace };
};

export const deleteWorkspaceService = async (
  workspaceId: string,
  userId: string
) => {
  try {
    const result = await workspaceRepository.deleteWithCascade(
      workspaceId,
      userId
    );

    if (!result) {
      throw new NotFoundException("Workspace not found");
    }

    return { currentWorkspace: result.currentWorkspace };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_DELETE") {
      throw new BadRequestException(
        "You are not authorized to delete this workspace"
      );
    }
    throw error;
  }
};

export const inviteMemberByEmailService = async (
  workspaceId: string,
  inviterUserId: string,
  inviteeEmail: string
) => {
  const workspace = await workspaceRepository.findById(workspaceId);

  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const inviter = await userRepository.findById(inviterUserId);
  const inviterName = inviter?.name ?? "A teammate";
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
  const inviteUrl = `${frontendOrigin}/invite/workspace/${workspace.inviteCode}/join`;

  await sendEmail({
    to: inviteeEmail,
    subject: `You're invited to join ${workspace.name} on ${APP_BRAND_NAME}`,
    text: `${inviterName} invited you to join the "${workspace.name}" workspace on ${APP_BRAND_NAME}.\n\nJoin here: ${inviteUrl}`,
    html: `<p><strong>${inviterName}</strong> invited you to join <strong>${workspace.name}</strong> on ${APP_BRAND_NAME}.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
  });

  return { message: "Invitation email sent" };
};
