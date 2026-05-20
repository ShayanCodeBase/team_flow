import { Prisma } from "@prisma/client";
import prisma from "../../../prisma/client";

type Tx = Prisma.TransactionClient;

export const setPrimaryAssignee = async (
  taskId: string,
  userId: string,
  assignedById?: string,
  tx: Tx = prisma
) => {
  await tx.taskAssignee.deleteMany({ where: { taskId } });
  await tx.taskAssignee.create({
    data: {
      taskId,
      userId,
      assignedById: assignedById ?? null,
    },
  });
};

export const replaceAssignees = async (
  taskId: string,
  userIds: string[],
  assignedById?: string,
  tx: Tx = prisma
) => {
  await tx.taskAssignee.deleteMany({ where: { taskId } });
  if (userIds.length === 0) return;

  await tx.taskAssignee.createMany({
    data: userIds.map((userId) => ({
      taskId,
      userId,
      assignedById: assignedById ?? null,
    })),
    skipDuplicates: true,
  });
};

export const findByTaskId = async (taskId: string) =>
  prisma.taskAssignee.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true, profilePicture: true } },
    },
    orderBy: { assignedAt: "asc" },
  });

export const getPrimaryUserId = async (taskId: string) => {
  const row = await prisma.taskAssignee.findFirst({
    where: { taskId },
    orderBy: { assignedAt: "asc" },
  });
  return row?.userId ?? null;
};
