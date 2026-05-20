import * as userRepo from "./implementations/prisma/user.prisma";

export const userRepository = {
  findById: userRepo.findById,
  findByEmail: userRepo.findByEmail,
  findByIdWithCurrentWorkspace: userRepo.findByIdWithCurrentWorkspace,
  create: userRepo.create,
  update: userRepo.update,
  setCurrentWorkspace: userRepo.setCurrentWorkspace,
  comparePassword: userRepo.comparePassword,
  omitPassword: userRepo.omitPassword,
  registerWithWorkspace: userRepo.registerWithWorkspace,
  loginOrCreateAccount: userRepo.loginOrCreateAccount,
  verifyByEmailPassword: userRepo.verifyByEmailPassword,
  setPasswordResetToken: userRepo.setPasswordResetToken,
  findUserByPasswordResetToken: userRepo.findUserByPasswordResetToken,
  updatePasswordAndClearReset: userRepo.updatePasswordAndClearReset,
};
