/** Maps Prisma UUID `id` fields to API `_id` for frontend compatibility. */
export const toObjectId = (id: string): string => id;

export const pickUserPublic = (user: {
  id: string;
  name: string | null;
  email?: string;
  profilePicture: string | null;
}) => ({
  _id: user.id,
  name: user.name,
  ...(user.email !== undefined ? { email: user.email } : {}),
  profilePicture: user.profilePicture,
});

export const pickProjectPublic = (project: {
  id: string;
  emoji: string;
  name: string;
  description?: string | null;
}) => ({
  _id: project.id,
  emoji: project.emoji,
  name: project.name,
  ...(project.description !== undefined
    ? { description: project.description }
    : {}),
});
