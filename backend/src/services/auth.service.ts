import { APP_BRAND_NAME } from "../config/email.config";
import { userRepository } from "../db/repositories";
import { sendEmail } from "./email.service";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";

export const loginOrCreateAccountService = async (data: {
  provider: string;
  displayName: string;
  providerId: string;
  picture?: string;
  email?: string;
}) => {
  const { providerId, provider, displayName, email, picture } = data;

  if (!email) {
    throw new BadRequestException("Email is required");
  }

  const user = await userRepository.loginOrCreateAccount({
    email,
    displayName,
    provider,
    providerId,
    picture,
  });

  return { user };
};

export const registerUserService = async (body: {
  email: string;
  name: string;
  password: string;
}) => {
  try {
    const result = await userRepository.registerWithWorkspace(body);
    return result;
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      throw new BadRequestException("Email already exists");
    }
    if (error instanceof Error && error.message === "OWNER_ROLE_NOT_FOUND") {
      throw new NotFoundException("Owner role not found");
    }
    throw error;
  }
};

export const verifyUserService = async ({
  email,
  password,
}: {
  email: string;
  password: string;
  provider?: string;
}) => {
  const user = await userRepository.verifyByEmailPassword(email, password);

  if (!user) {
    throw new UnauthorizedException("Invalid email or password");
  }

  return user;
};

export const requestPasswordResetService = async (email: string) => {
  const result = await userRepository.setPasswordResetToken(email);

  if (!result) {
    return {
      message:
        "If an account exists for that email, a password reset link has been sent.",
    };
  }

  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
  const resetUrl = `${frontendOrigin}/reset-password?token=${encodeURIComponent(result.rawToken)}`;

  await sendEmail({
    to: result.user.email,
    subject: `Reset your ${APP_BRAND_NAME} password`,
    text: `Hi${result.user.name ? ` ${result.user.name}` : ""},\n\nUse this link to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Hi${result.user.name ? ` ${result.user.name}` : ""},</p><p><a href="${resetUrl}">Reset your password</a> (link expires in 1 hour).</p><p>If you did not request this, ignore this email.</p>`,
  });

  return {
    message:
      "If an account exists for that email, a password reset link has been sent.",
  };
};

export const resetPasswordService = async (
  token: string,
  password: string
) => {
  const user = await userRepository.findUserByPasswordResetToken(token);

  if (!user) {
    throw new BadRequestException(
      "This password reset link is invalid or has expired"
    );
  }

  await userRepository.updatePasswordAndClearReset(user._id, password);

  return { message: "Password updated successfully" };
};
