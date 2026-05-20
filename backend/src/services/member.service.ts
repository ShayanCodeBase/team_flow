import { ErrorCodeEnum } from "../enums/error-code.enum";
import { Roles, RoleType } from "../enums/role.enum";
import { memberRepository, workspaceRepository } from "../db/repositories";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";

export const getMemberRoleInWorkspace = async (
  userId: string,
  workspaceId: string
) => {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const member = await memberRepository.findWithRole(userId, workspaceId);

  if (!member) {
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  const roleName =
    typeof member.role === "object" && member.role !== null && "name" in member.role
      ? (member.role as { name: string }).name
      : undefined;

  if (!roleName) {
    throw new NotFoundException("Role not found for member");
  }

  return { role: roleName as RoleType };
};

export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string
) => {
  const workspace = await workspaceRepository.findByInviteCode(inviteCode);
  if (!workspace) {
    throw new NotFoundException("Invalid invite code or workspace not found");
  }

  const workspaceId = String(workspace._id);

  const existingMember = await memberRepository.findOne({
    userId,
    workspaceId,
  });

  if (existingMember) {
    throw new BadRequestException("You are already a member of this workspace");
  }

  const role = await memberRepository.findRoleByName(Roles.MEMBER);

  if (!role) {
    throw new NotFoundException("Role not found");
  }

  await memberRepository.create({
    userId,
    workspaceId,
    roleId: String(role._id),
  });

  return { workspaceId, role: role.name };
};
