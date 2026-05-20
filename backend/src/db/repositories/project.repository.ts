import * as projectRepo from "./implementations/prisma/project.prisma";

export const projectRepository = {
  findById: projectRepo.findById,
  findOneInWorkspace: projectRepo.findOneInWorkspace,
  findMany: projectRepo.findMany,
  create: projectRepo.create,
  update: projectRepo.update,
  delete: projectRepo.deleteOne,
  count: projectRepo.count,
};
