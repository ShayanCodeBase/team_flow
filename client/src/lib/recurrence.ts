import { z } from "zod";

export type RecurrenceType = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
export type RecurrenceUnit = "day" | "week" | "month";

export type RecurrenceRule = {
  type: RecurrenceType;
  interval?: number;
  unit?: RecurrenceUnit;
};

export type RecurrenceFormPreset =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "CUSTOM";

export const RECURRENCE_PRESET_VALUES = [
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "CUSTOM",
] as const;

export const RECURRENCE_UNIT_VALUES = ["day", "week", "month"] as const;

export const recurrenceZodFields = {
  recurrencePreset: z.enum(RECURRENCE_PRESET_VALUES),
  recurrenceInterval: z.coerce.number().int().min(1).optional(),
  recurrenceUnit: z.enum(RECURRENCE_UNIT_VALUES).optional(),
};

export type RecurrenceFormValues = {
  recurrencePreset: RecurrenceFormPreset;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
};

export const validateRecurrenceFormFields = (
  data: RecurrenceFormValues,
  ctx: z.RefinementCtx
) => {
  if (data.recurrencePreset !== "CUSTOM") return;
  if (!data.recurrenceInterval) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Interval is required for custom recurrence",
      path: ["recurrenceInterval"],
    });
  }
  if (!data.recurrenceUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Unit is required for custom recurrence",
      path: ["recurrenceUnit"],
    });
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isRecurrenceRule = (value: unknown): value is RecurrenceRule => {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  if (
    value.type !== "DAILY" &&
    value.type !== "WEEKLY" &&
    value.type !== "MONTHLY" &&
    value.type !== "CUSTOM"
  ) {
    return false;
  }
  if (value.type === "CUSTOM") {
    if (value.interval !== undefined && typeof value.interval !== "number") {
      return false;
    }
    if (
      value.unit !== undefined &&
      value.unit !== "day" &&
      value.unit !== "week" &&
      value.unit !== "month"
    ) {
      return false;
    }
  }
  return true;
};

export const hasRecurrence = (
  recurrence: Record<string, unknown> | null | undefined
): recurrence is RecurrenceRule =>
  recurrence !== null &&
  recurrence !== undefined &&
  isRecurrenceRule(recurrence);

export const recurrenceToFormDefaults = (
  recurrence: Record<string, unknown> | null | undefined
): {
  recurrencePreset: RecurrenceFormPreset;
  recurrenceInterval: number;
  recurrenceUnit: RecurrenceUnit;
} => {
  if (!hasRecurrence(recurrence)) {
    return {
      recurrencePreset: "NONE",
      recurrenceInterval: 1,
      recurrenceUnit: "day",
    };
  }

  switch (recurrence.type) {
    case "DAILY":
      return {
        recurrencePreset: "DAILY",
        recurrenceInterval: 1,
        recurrenceUnit: "day",
      };
    case "WEEKLY":
      return {
        recurrencePreset: "WEEKLY",
        recurrenceInterval: 1,
        recurrenceUnit: "week",
      };
    case "MONTHLY":
      return {
        recurrencePreset: "MONTHLY",
        recurrenceInterval: 1,
        recurrenceUnit: "month",
      };
    case "CUSTOM":
      return {
        recurrencePreset: "CUSTOM",
        recurrenceInterval:
          typeof recurrence.interval === "number" && recurrence.interval > 0
            ? recurrence.interval
            : 1,
        recurrenceUnit:
          recurrence.unit === "week" || recurrence.unit === "month"
            ? recurrence.unit
            : "day",
      };
    default:
      return {
        recurrencePreset: "NONE",
        recurrenceInterval: 1,
        recurrenceUnit: "day",
      };
  }
};

export const formValuesToRecurrence = (
  preset: RecurrenceFormPreset,
  interval: number | undefined,
  unit: RecurrenceUnit | undefined
): RecurrenceRule | null => {
  switch (preset) {
    case "NONE":
      return null;
    case "DAILY":
      return { type: "DAILY" };
    case "WEEKLY":
      return { type: "WEEKLY" };
    case "MONTHLY":
      return { type: "MONTHLY" };
    case "CUSTOM": {
      const safeInterval = interval && interval > 0 ? interval : 1;
      const safeUnit = unit ?? "day";
      return { type: "CUSTOM", interval: safeInterval, unit: safeUnit };
    }
    default:
      return null;
  }
};
