import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validation/auth.validation";
import { HTTPSTATUS } from "../config/http.config";
import {
  registerUserService,
  requestPasswordResetService,
  resetPasswordService,
} from "../services/auth.service";
import { userRepository } from "../db/repositories";
import { ErrorCodeEnum } from "../enums/error-code.enum";
import { sendError, sendSuccess } from "../utils/apiResponse";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  verifyRefreshToken,
} from "../utils/jwt";
import passport from "passport";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const FRONTEND_GOOGLE_OAUTH_CALLBACK = `${FRONTEND_ORIGIN}/google/oauth/callback`;

const issueAuthTokens = async (
  res: Response,
  user: { _id: string; email: string }
) => {
  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
  });
  const refreshToken = generateRefreshToken({ userId: user._id });
  setRefreshTokenCookie(res, refreshToken);

  const mappedUser = await userRepository.findByIdWithCurrentWorkspace(user._id);
  if (!mappedUser) {
    throw new Error("User not found after authentication");
  }

  return { accessToken, user: mappedUser };
};

export const googleLoginCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const passportUser = req.user as Express.User | undefined;

    if (!passportUser?._id || !passportUser.email) {
      return res.redirect(
        `${FRONTEND_GOOGLE_OAUTH_CALLBACK}?status=failure`
      );
    }

    const { accessToken } = await issueAuthTokens(res, {
      _id: passportUser._id,
      email: passportUser.email,
    });

    return res.redirect(
      `${FRONTEND_GOOGLE_OAUTH_CALLBACK}?token=${encodeURIComponent(accessToken)}`
    );
  }
);

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse({
      ...req.body,
    });

    await registerUserService(body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User created successfully",
    });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      { session: false },
      async (
        err: Error | null,
        user: Express.User | false,
        info: { message: string } | undefined
      ) => {
        if (err) {
          return next(err);
        }

        if (!user || !user._id || !user.email) {
          return sendError(
            res,
            info?.message || "Invalid email or password",
            HTTPSTATUS.UNAUTHORIZED,
            undefined,
            ErrorCodeEnum.AUTH_UNAUTHORIZED_ACCESS
          );
        }

        try {
          const { accessToken, user: mappedUser } = await issueAuthTokens(res, {
            _id: user._id,
            email: user.email,
          });

          return sendSuccess(res, { accessToken, user: mappedUser });
        } catch (error) {
          return next(error);
        }
      }
    )(req, res, next);
  }
);

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      return sendError(
        res,
        "Refresh token is required",
        HTTPSTATUS.UNAUTHORIZED
      );
    }

    try {
      const { userId } = verifyRefreshToken(refreshToken);
      const user = await userRepository.findById(userId);

      if (!user) {
        return sendError(res, "User not found", HTTPSTATUS.UNAUTHORIZED);
      }

      const accessToken = generateAccessToken({
        userId: user._id,
        email: user.email,
      });

      return sendSuccess(res, { accessToken });
    } catch {
      return sendError(
        res,
        "Invalid or expired refresh token",
        HTTPSTATUS.UNAUTHORIZED
      );
    }
  }
);

export const logOutController = asyncHandler(
  async (_req: Request, res: Response) => {
    clearRefreshTokenCookie(res);
    return sendSuccess(res, { message: "Logged out successfully" });
  }
);

export const forgotPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await requestPasswordResetService(email);
    return sendSuccess(res, result);
  }
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const result = await resetPasswordService(token, password);
    return sendSuccess(res, result);
  }
);
