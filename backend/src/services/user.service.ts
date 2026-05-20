import { userRepository } from "../db/repositories";
import { BadRequestException } from "../utils/appError";

export const getCurrentUserService = async (userId: string) => {
  const user = await userRepository.findByIdWithCurrentWorkspace(userId);

  if (!user) {
    throw new BadRequestException("User not found");
  }

  return { user };
};
