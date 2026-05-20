import * as taskAssigneeRepo from "./implementations/prisma/taskAssignee.prisma";

export const taskAssigneeRepository = {
  setPrimaryAssignee: taskAssigneeRepo.setPrimaryAssignee,
  replaceAssignees: taskAssigneeRepo.replaceAssignees,
  findByTaskId: taskAssigneeRepo.findByTaskId,
  getPrimaryUserId: taskAssigneeRepo.getPrimaryUserId,
};
