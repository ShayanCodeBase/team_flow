import { WorkspaceRoleName } from "@prisma/client";
import prisma from "../../../prisma/client";
import { RolePermissions } from "../../../../utils/role-permission";

const ensureRolesSeeded = async () => {
  const count = await prisma.role.count();
  if (count > 0) return;

  const roles = Object.keys(RolePermissions) as WorkspaceRoleName[];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      create: {
        name,
        permissions: RolePermissions[name as keyof typeof RolePermissions],
      },
      update: {},
    });
  }
};

export const findById = async (memberId: string) => {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  return member
    ? {
        _id: member.id,
        userId: member.userId,
        workspaceId: member.workspaceId,
        role: member.roleId,
        joinedAt: member.joinedAt,
      }
    : null;
};

export const findMany = async (query: {
  workspaceId?: string;
  userId?: string;
}) => {
  const members = await prisma.member.findMany({ where: query });
  return members.map((m) => ({
    _id: m.id,
    userId: m.userId,
    workspaceId: m.workspaceId,
    role: m.roleId,
    joinedAt: m.joinedAt,
  }));
};

export const findOne = async (query: { userId?: string; workspaceId?: string }) => {
  const member = await prisma.member.findFirst({ where: query });
  return member
    ? {
        _id: member.id,
        userId: member.userId,
        workspaceId: member.workspaceId,
        role: member.roleId,
        joinedAt: member.joinedAt,
      }
    : null;
};

export const exists = async (query: { userId: string; workspaceId: string }) => {
  const member = await prisma.member.findFirst({ where: query });
  return member !== null;
};

export const create = async (data: {
  userId: string;
  workspaceId: string;
  roleId: string;
  joinedAt?: Date;
}) => {
  const member = await prisma.member.create({
    data: {
      userId: data.userId,
      workspaceId: data.workspaceId,
      roleId: data.roleId,
      joinedAt: data.joinedAt ?? new Date(),
    },
  });
  return {
    _id: member.id,
    userId: member.userId,
    workspaceId: member.workspaceId,
    role: member.roleId,
    joinedAt: member.joinedAt,
  };
};

export const updateRole = async (memberId: string, roleId: string) => {
  const member = await prisma.member.update({
    where: { id: memberId },
    data: { roleId },
  });
  return {
    _id: member.id,
    userId: member.userId,
    workspaceId: member.workspaceId,
    role: member.roleId,
  };
};

export const updateRoleByUserAndWorkspace = async (
  userId: string,
  workspaceId: string,
  roleId: string
) => {
  const member = await prisma.member.updateMany({
    where: { userId, workspaceId },
    data: { roleId },
  });
  if (member.count === 0) return null;
  return findOne({ userId, workspaceId });
};

export const findWithRole = async (userId: string, workspaceId: string) => {
  const member = await prisma.member.findFirst({
    where: { userId, workspaceId },
    include: { role: true },
  });
  if (!member) return null;
  return {
    _id: member.id,
    userId: member.userId,
    workspaceId: member.workspaceId,
    role: { _id: member.role.id, name: member.role.name },
  };
};

export const findWorkspaceMembersPopulated = async (workspaceId: string) => {
  const members = await prisma.member.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, profilePicture: true },
      },
      role: { select: { id: true, name: true } },
    },
  });

  return members.map((m) => ({
    _id: m.id,
    userId: {
      _id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      profilePicture: m.user.profilePicture,
    },
    workspaceId: m.workspaceId,
    role: { _id: m.role.id, name: m.role.name },
    joinedAt: m.joinedAt,
    createdAt: m.createdAt,
  }));
};

export const findUserMemberships = async (userId: string) => {
  const members = await prisma.member.findMany({
    where: { userId },
    include: { workspace: true },
  });

  return members.map((m) => ({
    _id: m.id,
    userId: m.userId,
    workspaceId: {
      _id: m.workspace.id,
      name: m.workspace.name,
      description: m.workspace.description,
      owner: m.workspace.ownerId,
      inviteCode: m.workspace.inviteCode,
    },
  }));
};

export const deleteByWorkspace = async (workspaceId: string) =>
  prisma.member.deleteMany({ where: { workspaceId } });

export const count = async (query: { workspaceId?: string }) =>
  prisma.member.count({ where: query });

export const findAllRoles = async () => {
  await ensureRolesSeeded();
  return prisma.role.findMany({
    select: { id: true, name: true },
  }).then((roles) =>
    roles.map((r) => ({ _id: r.id, name: r.name }))
  );
};

export const findRoleById = async (roleId: string) => {
  await ensureRolesSeeded();
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  return role ? { _id: role.id, name: role.name, permissions: role.permissions } : null;
};

export const findRoleByName = async (name: string) => {
  await ensureRolesSeeded();
  const role = await prisma.role.findUnique({
    where: { name: name as WorkspaceRoleName },
  });
  return role ? { _id: role.id, name: role.name, permissions: role.permissions } : null;
};
