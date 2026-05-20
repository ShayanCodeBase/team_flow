import * as commentRepo from "./implementations/prisma/comment.prisma";

export const commentRepository = {
  findById: commentRepo.findById,
  findManyPaginated: commentRepo.findManyPaginated,
  create: commentRepo.create,
  update: commentRepo.update,
  delete: commentRepo.softDelete,
  count: commentRepo.count,
};
