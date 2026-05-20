import {
  projectRepository,
  taskRepository,
} from "../db/repositories";
import { NotFoundException } from "../utils/appError";

export const createProjectService = async (
  userId: string,
  workspaceId: string,
  body: {
    emoji?: string;
    name: string;
    description?: string;
  }
) => {
  const project = await projectRepository.create({
    ...(body.emoji && { emoji: body.emoji }),
    name: body.name,
    description: body.description,
    workspaceId,
    createdById: userId,
  });

  return { project };
};

export const getProjectsInWorkspaceService = async (
  workspaceId: string,
  pageSize: number,
  pageNumber: number
) => {
  const skip = (pageNumber - 1) * pageSize;

  const { projects, totalCount } = await projectRepository.findMany(
    workspaceId,
    { skip, limit: pageSize }
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  return { projects, totalCount, totalPages, skip };
};

export const getProjectByIdAndWorkspaceIdService = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await projectRepository.findOneInWorkspace(
    projectId,
    workspaceId
  );

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace"
    );
  }

  return {
    project: {
      _id: project._id,
      emoji: project.emoji,
      name: project.name,
      description: project.description,
    },
  };
};

export const getProjectAnalyticsService = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await projectRepository.findById(projectId);

  if (!project || project.workspace?.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const analytics = await taskRepository.countProjectAnalytics(projectId);

  return { analytics };
};

export const updateProjectService = async (
  workspaceId: string,
  projectId: string,
  body: {
    emoji?: string;
    name: string;
    description?: string;
  }
) => {
  const project = await projectRepository.update(projectId, workspaceId, body);

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace"
    );
  }

  return { project };
};

export const deleteProjectService = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await projectRepository.delete(projectId, workspaceId);

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace"
    );
  }

  await taskRepository.deleteByProject(projectId);

  return project;
};
