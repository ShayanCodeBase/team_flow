import prisma from "../../../prisma/client";
import { pickUserPublic } from "../../../mappers/document.mapper";

const mapProject = (project: {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  workspaceId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string | null;
    profilePicture: string | null;
  };
}) => ({
  _id: project.id,
  name: project.name,
  emoji: project.emoji,
  description: project.description,
  workspace: project.workspaceId,
  createdBy: project.createdBy
    ? pickUserPublic(project.createdBy)
    : project.createdById,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

const projectInclude = {
  createdBy: {
    select: { id: true, name: true, profilePicture: true },
  },
};

export const findById = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude,
  });
  return project ? mapProject(project) : null;
};

export const findOneInWorkspace = async (
  projectId: string,
  workspaceId: string
) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });
  return project ? mapProject(project) : null;
};

export const findMany = async (
  workspaceId: string,
  pagination: { skip: number; limit: number }
) => {
  const where = { workspaceId };
  const [rows, totalCount] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: projectInclude,
    }),
    prisma.project.count({ where }),
  ]);

  return { projects: rows.map(mapProject), totalCount };
};

export const create = async (data: {
  name: string;
  emoji?: string;
  description?: string;
  workspaceId: string;
  createdById: string;
}) => {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      emoji: data.emoji ?? "📊",
      description: data.description,
      workspaceId: data.workspaceId,
      createdById: data.createdById,
    },
    include: projectInclude,
  });
  return mapProject(project);
};

export const update = async (
  projectId: string,
  workspaceId: string,
  data: { name?: string; emoji?: string; description?: string }
) => {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });
  if (!existing) return null;

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.emoji !== undefined ? { emoji: data.emoji } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
    },
    include: projectInclude,
  });
  return mapProject(project);
};

export const deleteOne = async (projectId: string, workspaceId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });
  if (!project) return null;
  await prisma.project.delete({ where: { id: projectId } });
  return mapProject(project);
};

export const count = async (workspaceId: string) =>
  prisma.project.count({ where: { workspaceId } });
