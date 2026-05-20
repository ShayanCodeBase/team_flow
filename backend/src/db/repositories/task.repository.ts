import * as taskRepo from "./implementations/prisma/task.prisma";
import {
  PaginationInput,
  TaskAnalytics,
  TaskCreateInput,
  TaskFilters,
  TaskUpdateInput,
} from "./types";

export type {
  PaginationInput,
  TaskAnalytics,
  TaskCreateInput,
  TaskFilters,
  TaskUpdateInput,
};

export const taskRepository = {
  findById: taskRepo.findById,
  findOneInProject: taskRepo.findOneInProject,
  findMany: taskRepo.findMany,
  create: taskRepo.create,
  update: taskRepo.update,
  delete: taskRepo.softDelete,
  deleteByProject: taskRepo.deleteByProject,
  deleteByWorkspace: taskRepo.deleteByWorkspace,
  count: taskRepo.count,
  countProjectAnalytics: taskRepo.countProjectAnalytics,
  countWorkspaceAnalytics: taskRepo.countWorkspaceAnalytics,
  getChildren: taskRepo.getChildren,
  getSubtree: taskRepo.getSubtree,
  moveTask: taskRepo.moveTask,
  updateStatus: taskRepo.updateStatus,
};
