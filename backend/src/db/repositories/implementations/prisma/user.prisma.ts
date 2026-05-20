import { WorkspaceRoleName } from "@prisma/client";
import prisma from "../../../prisma/client";
import crypto from "crypto";
import { hashValue, compareValue } from "../../../../utils/bcrypt";
import { Roles } from "../../../../enums/role.enum";
import { RolePermissions } from "../../../../utils/role-permission";
import { generateInviteCode } from "../../../../utils/uuid";

const mapUserToApi = (user: {
  id: string;
  name: string | null;
  email: string;
  profilePicture: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  currentWorkspaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentWorkspace?: {
    id: string;
    name: string;
    ownerId: string;
    inviteCode: string;
    description: string | null;
  } | null;
}) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  profilePicture: user.profilePicture,
  isActive: user.isActive,
  lastLogin: user.lastLoginAt,
  currentWorkspace: user.currentWorkspace
    ? {
        _id: user.currentWorkspace.id,
        name: user.currentWorkspace.name,
        owner: user.currentWorkspace.ownerId,
        inviteCode: user.currentWorkspace.inviteCode,
        description: user.currentWorkspace.description,
      }
    : user.currentWorkspaceId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

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

export const findById = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? mapUserToApi(user) : null;
};

export const findByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  return user ? mapUserToApi(user) : null;
};

export const findByIdWithCurrentWorkspace = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { currentWorkspace: true },
  });
  return user ? mapUserToApi(user) : null;
};

export const create = async (data: {
  email: string;
  name: string;
  password?: string;
  profilePicture?: string | null;
}) => {
  const passwordHash = data.password
    ? await hashValue(data.password)
    : null;

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      profilePicture: data.profilePicture ?? null,
    },
  });
  return mapUserToApi(user);
};

export const update = async (userId: string, data: Record<string, unknown>) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: data as Parameters<typeof prisma.user.update>[0]["data"],
  });
  return mapUserToApi(user);
};

export const setCurrentWorkspace = async (
  userId: string,
  workspaceId: string | null
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { currentWorkspaceId: workspaceId },
  });
  return mapUserToApi(user);
};

export const comparePassword = async (userId: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) return false;
  return compareValue(password, user.passwordHash);
};

export const omitPassword = (user: ReturnType<typeof mapUserToApi>) => user;

export const registerWithWorkspace = async (data: {
  email: string;
  name: string;
  password: string;
}) => {
  await ensureRolesSeeded();

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) throw new Error("EMAIL_EXISTS");

  const passwordHash = await hashValue(data.password);

  const result = await prisma.$transaction(async (tx) => {
    const ownerRole = await tx.role.findUnique({
      where: { name: WorkspaceRoleName.OWNER },
    });
    if (!ownerRole) throw new Error("OWNER_ROLE_NOT_FOUND");

    const user = await tx.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: "My Workspace",
        description: `Workspace created for ${user.name}`,
        ownerId: user.id,
        inviteCode: generateInviteCode(),
      },
    });

    await tx.member.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        roleId: ownerRole.id,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { currentWorkspaceId: workspace.id },
    });

    return { userId: user.id, workspaceId: workspace.id };
  });

  return result;
};

export const loginOrCreateAccount = async (data: {
  email: string;
  displayName: string;
  provider: string;
  providerId: string;
  picture?: string;
}) => {
  await ensureRolesSeeded();

  const email = data.email.toLowerCase();
  let user = await prisma.user.findUnique({
    where: { email },
    include: { currentWorkspace: true },
  });

  if (!user) {
    user = await prisma.$transaction(async (tx) => {
      const ownerRole = await tx.role.findUnique({
        where: { name: WorkspaceRoleName.OWNER },
      });
      if (!ownerRole) throw new Error("OWNER_ROLE_NOT_FOUND");

      const created = await tx.user.create({
        data: {
          email,
          name: data.displayName,
          profilePicture: data.picture ?? null,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: "My Workspace",
          description: `Workspace created for ${created.name}`,
          ownerId: created.id,
          inviteCode: generateInviteCode(),
        },
      });

      await tx.member.create({
        data: {
          userId: created.id,
          workspaceId: workspace.id,
          roleId: ownerRole.id,
        },
      });

      return tx.user.update({
        where: { id: created.id },
        data: { currentWorkspaceId: workspace.id },
        include: { currentWorkspace: true },
      });
    });
  }

  return mapUserToApi(user);
};

export const verifyByEmailPassword = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user?.passwordHash) return null;

  const isMatch = await compareValue(password, user.passwordHash);
  if (!isMatch) return null;

  return mapUserToApi(user);
};

export const setPasswordResetToken = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return null;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = await hashValue(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: expiresAt,
    },
  });

  return { rawToken, user: mapUserToApi(user) };
};

export const findUserByPasswordResetToken = async (rawToken: string) => {
  const users = await prisma.user.findMany({
    where: {
      passwordResetToken: { not: null },
      passwordResetExpires: { gt: new Date() },
    },
  });

  for (const user of users) {
    if (
      user.passwordResetToken &&
      (await compareValue(rawToken, user.passwordResetToken))
    ) {
      return mapUserToApi(user);
    }
  }

  return null;
};

export const updatePasswordAndClearReset = async (
  userId: string,
  newPassword: string
) => {
  const passwordHash = await hashValue(newPassword);
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
  return mapUserToApi(user);
};
