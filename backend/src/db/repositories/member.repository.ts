import * as memberRepo from "./implementations/prisma/member.prisma";

export const memberRepository = {
  findById: memberRepo.findById,
  findMany: memberRepo.findMany,
  findOne: memberRepo.findOne,
  exists: memberRepo.exists,
  create: memberRepo.create,
  updateRole: memberRepo.updateRole,
  updateRoleByUserAndWorkspace: memberRepo.updateRoleByUserAndWorkspace,
  findWithRole: memberRepo.findWithRole,
  findWorkspaceMembersPopulated: memberRepo.findWorkspaceMembersPopulated,
  findUserMemberships: memberRepo.findUserMemberships,
  deleteByWorkspace: memberRepo.deleteByWorkspace,
  count: memberRepo.count,
  findAllRoles: memberRepo.findAllRoles,
  findRoleById: memberRepo.findRoleById,
  findRoleByName: memberRepo.findRoleByName,
};
