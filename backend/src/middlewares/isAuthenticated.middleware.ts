import { NextFunction, Request, RequestHandler, Response } from "express";
import { userRepository } from "../db/repositories";
import { UnauthorizedException } from "../utils/appError";
import { verifyAccessToken } from "../utils/jwt";

const authenticateRequest = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Unauthorized. Please log in.");
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException("Unauthorized. Please log in.");
    }

    const { userId } = verifyAccessToken(token);
    const user = await userRepository.findByIdWithCurrentWorkspace(userId);

    if (!user) {
      throw new UnauthorizedException("Unauthorized. Please log in.");
    }

    req.user = user as Express.User;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      return next(error);
    }
    return next(new UnauthorizedException("Unauthorized. Please log in."));
  }
};

/** JWT bearer auth — attaches the same mapped user shape controllers expect (`_id`, etc.). */
const isAuthenticated: RequestHandler = (req, res, next) => {
  void authenticateRequest(req, res, next);
};

export default isAuthenticated;
