import prisma from "../../../prisma/client";
import { pickUserPublic } from "../../../mappers/document.mapper";

const mapComment = (comment: {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string | null; profilePicture: string | null };
}) => ({
  _id: comment.id,
  content: comment.content,
  taskId: comment.taskId,
  author: pickUserPublic(comment.author),
  authorId: comment.authorId,
  isDeleted: comment.isDeleted,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

export const findById = async (id: string) => {
  const comment = await prisma.comment.findFirst({
    where: { id, isDeleted: false },
    include: {
      author: { select: { id: true, name: true, profilePicture: true } },
    },
  });
  return comment ? mapComment(comment) : null;
};

export const findManyPaginated = async (
  taskId: string,
  pagination: { pageNumber: number; pageSize: number }
) => {
  const { pageNumber, pageSize } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const where = { taskId, isDeleted: false };

  const [comments, totalCount] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        author: { select: { id: true, name: true, profilePicture: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    comments: comments.map(mapComment),
    totalCount,
  };
};

export const create = async (data: {
  taskId: string;
  authorId: string;
  content: string;
}) => {
  const comment = await prisma.comment.create({
    data: {
      taskId: data.taskId,
      authorId: data.authorId,
      content: data.content,
    },
    include: {
      author: { select: { id: true, name: true, profilePicture: true } },
    },
  });
  return mapComment(comment);
};

export const update = async (
  id: string,
  authorId: string,
  content: string
) => {
  const existing = await prisma.comment.findFirst({
    where: { id, authorId, isDeleted: false },
  });
  if (!existing) return null;

  const comment = await prisma.comment.update({
    where: { id },
    data: { content },
    include: {
      author: { select: { id: true, name: true, profilePicture: true } },
    },
  });
  return mapComment(comment);
};

export const softDelete = async (id: string, authorId: string) => {
  const existing = await prisma.comment.findFirst({
    where: { id, authorId, isDeleted: false },
  });
  if (!existing) return null;

  await prisma.comment.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return true;
};

export const count = async (taskId: string) =>
  prisma.comment.count({ where: { taskId, isDeleted: false } });
