import jwt from "jsonwebtoken";
import { Response } from "express";
import { UnauthorizedException } from "./appError";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "";
const NODE_ENV = process.env.NODE_ENV ?? "development";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type AccessTokenPayload = {
  userId: string;
  email: string;
};

export type RefreshTokenPayload = {
  userId: string;
};

export const generateAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

export const generateRefreshToken = (payload: RefreshTokenPayload): string =>
  jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string" || !decoded.userId || !decoded.email) {
      throw new UnauthorizedException("Invalid access token");
    }
    return {
      userId: decoded.userId as string,
      email: decoded.email as string,
    };
  } catch {
    throw new UnauthorizedException("Invalid or expired access token");
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (typeof decoded === "string" || !decoded.userId) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    return { userId: decoded.userId as string };
  } catch {
    throw new UnauthorizedException("Invalid or expired refresh token");
  }
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
  });
};

export const getRefreshTokenFromRequest = (req: {
  cookies?: Record<string, string>;
}): string | undefined => req.cookies?.[REFRESH_COOKIE_NAME];
