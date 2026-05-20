import * as workspaceRepo from "./implementations/prisma/workspace.prisma";

export const workspaceRepository = {
  findById: workspaceRepo.findById,
  findByInviteCode: workspaceRepo.findByInviteCode,
  create: workspaceRepo.create,
  update: workspaceRepo.update,
  findByIdWithMembers: workspaceRepo.findByIdWithMembers,
  deleteWithCascade: workspaceRepo.deleteWithCascade,
};
