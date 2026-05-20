import { AxiosError, isAxiosError } from "axios";
import type { ApiErrorEnvelope } from "./api-response";

const STATUS_MESSAGES: Record<number, string> = {
  400: "The request was invalid. Please check your input and try again.",
  401: "You need to sign in to continue.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "This action conflicts with existing data.",
  422: "Please fix the highlighted fields and try again.",
  429: "Too many attempts. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again later.",
  503: "The service is temporarily unavailable. Please try again later.",
};

const FRIENDLY_ERROR_CODE_MESSAGES: Record<string, string> = {
  ACCESS_UNAUTHORIZED:
    "You do not have permission to perform this action.",
  AUTH_EMAIL_ALREADY_EXISTS:
    "An account with this email already exists. Try signing in instead.",
  AUTH_INVALID_TOKEN: "This link is invalid or has expired.",
  AUTH_USER_NOT_FOUND: "No account was found for this email.",
  AUTH_UNAUTHORIZED_ACCESS: "Invalid email or password.",
  VALIDATION_ERROR: "Please check your input and try again.",
  RESOURCE_NOT_FOUND: "The requested resource was not found.",
  INTERNAL_SERVER_ERROR:
    "Something went wrong on our side. Please try again later.",
};

const isTimeoutMessage = (message: string): boolean =>
  /timeout.*exceeded/i.test(message) || /timeout \d+ of ms exceeded/i.test(message);

const isAbortMessage = (message: string): boolean =>
  /aborted|cancelled|canceled/i.test(message);

const firstFieldError = (
  errors?: Record<string, string>
): string | undefined => {
  if (!errors) return undefined;
  const values = Object.values(errors).filter(Boolean);
  return values[0];
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  if (!error) return fallback;

  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorEnvelope & { message?: string }>;
    const data = axiosError.response?.data;
    const status = axiosError.response?.status;

    if (data && typeof data === "object") {
      if (data.success === false && data.message) {
        const fieldMsg = firstFieldError(data.errors);
        return fieldMsg ?? data.message;
      }
      if ("message" in data && typeof data.message === "string" && data.message) {
        return data.message;
      }
    }

    if (axiosError.code === AxiosError.ETIMEDOUT || isTimeoutMessage(axiosError.message)) {
      return "The request took too long. Your changes may still have been saved — refresh to check.";
    }

    if (axiosError.code === AxiosError.ERR_CANCELED || isAbortMessage(axiosError.message)) {
      return fallback;
    }

    if (axiosError.message === "Network Error") {
      return "Unable to reach the server. Check your connection and try again.";
    }

    if (status && STATUS_MESSAGES[status]) {
      return STATUS_MESSAGES[status];
    }
  }

  if (error instanceof Error) {
    const custom = error as Error & { errorCode?: string };
    if (custom.errorCode && FRIENDLY_ERROR_CODE_MESSAGES[custom.errorCode]) {
      return FRIENDLY_ERROR_CODE_MESSAGES[custom.errorCode];
    }

    if (isTimeoutMessage(custom.message)) {
      return "The request took too long. Your changes may still have been saved — refresh to check.";
    }

    if (isAbortMessage(custom.message)) {
      return fallback;
    }

    if (
      custom.message &&
      !custom.message.startsWith("Request failed with status code")
    ) {
      return custom.message;
    }
  }

  return fallback;
};

export const toApiError = (
  error: unknown,
  fallback?: string
): Error & { errorCode?: string } => {
  const message = getApiErrorMessage(error, fallback);
  const err = new Error(message) as Error & { errorCode?: string };

  if (isAxiosError(error)) {
    const data = error.response?.data as { errorCode?: string } | undefined;
    if (data?.errorCode) {
      err.errorCode = data.errorCode;
    }
  } else if (error instanceof Error) {
    const custom = error as Error & { errorCode?: string };
    if (custom.errorCode) err.errorCode = custom.errorCode;
  }

  return err;
};
