import { ErrorRequestHandler } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { AppError } from "../utils/appError";
import { ZodError } from "zod";
import { ErrorCodeEnum } from "../enums/error-code.enum";
import { sendError, zodErrorsToFieldMap } from "../utils/apiResponse";

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): void => {
  console.error(`Error Occured on PATH: ${req.path} `, error);

  if (error instanceof SyntaxError) {
    sendError(
      res,
      "Invalid JSON format. Please check your request body.",
      HTTPSTATUS.BAD_REQUEST
    );
    return;
  }

  if (error instanceof ZodError) {
    sendError(
      res,
      "Validation failed",
      HTTPSTATUS.BAD_REQUEST,
      zodErrorsToFieldMap(error.issues)
    );
    return;
  }

  if (error instanceof AppError) {
    sendError(res, error.message, error.statusCode, undefined, error.errorCode);
    return;
  }

  sendError(
    res,
    "Something went wrong. Please try again later.",
    HTTPSTATUS.INTERNAL_SERVER_ERROR,
    undefined,
    ErrorCodeEnum.INTERNAL_SERVER_ERROR
  );
};
