import * as taskActivityRepo from "./implementations/prisma/taskActivity.prisma";

export type { TaskActivityCreateInput } from "./implementations/prisma/taskActivity.prisma";

export const taskActivityRepository = {
  create: taskActivityRepo.create,
  findManyByTaskId: taskActivityRepo.findManyByTaskId,
  findRecentByWorkspaceId: taskActivityRepo.findRecentByWorkspaceId,
};
