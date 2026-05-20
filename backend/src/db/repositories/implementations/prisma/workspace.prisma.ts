import prisma from "../../../prisma/client";

const mapWorkspace = (workspace: {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  _id: workspace.id,
  name: workspace.name,
  description: workspace.description,
  owner: workspace.ownerId,
  inviteCode: workspace.inviteCode,
  createdAt: workspace.createdAt,
  updatedAt: workspace.updatedAt,
});

export const findById = async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  return workspace ? mapWorkspace(workspace) : null;
};

export const findByInviteCode = async (inviteCode: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode },
  });
  return workspace ? mapWorkspace(workspace) : null;
};

export const create = async (data: {
  name: string;
  description?: string;
  ownerId: string;
}) => {
  const { generateInviteCode } = await import("../../../../utils/uuid");
  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
      inviteCode: generateInviteCode(),
    },
  });
  return mapWorkspace(workspace);
};

export const update = async (
  workspaceId: string,
  data: { name?: string; description?: string }
) => {
  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
    },
  });
  return mapWorkspace(workspace);
};

export const findByIdWithMembers = async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) return null;

  return {
    ...mapWorkspace(workspace),
    members: workspace.members.map((m) => ({
      _id: m.id,
      userId: m.userId,
      workspaceId: m.workspaceId,
      role: {
        _id: m.role.id,
        name: m.role.name,
        permissions: m.role.permissions,
      },
      joinedAt: m.joinedAt,
      createdAt: m.createdAt,
    })),
  };
};

export const deleteWithCascade = async (workspaceId: string, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) return null;

    if (workspace.ownerId !== userId) {
      throw new Error("UNAUTHORIZED_DELETE");
    }

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    await tx.task.updateMany({
      where: { workspaceId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    await tx.project.deleteMany({ where: { workspaceId } });
    await tx.member.deleteMany({ where: { workspaceId } });
    await tx.workspace.delete({ where: { id: workspaceId } });

    let currentWorkspaceId = user.currentWorkspaceId;
    if (currentWorkspaceId === workspaceId) {
      const next = await tx.member.findFirst({ where: { userId } });
      currentWorkspaceId = next?.workspaceId ?? null;
      await tx.user.update({
        where: { id: userId },
        data: { currentWorkspaceId },
      });
    }

    return { currentWorkspace: currentWorkspaceId };
  });
};
