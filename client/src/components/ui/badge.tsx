import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  TaskPriorityEnum,
  TaskStatusEnum,
} from "@/constant";

const statusVariantEntries = Object.fromEntries(
  Object.values(TaskStatusEnum).map((status) => [
    status,
    TASK_STATUS_CONFIG[status].badgeClass,
  ])
) as Record<(typeof TaskStatusEnum)[keyof typeof TaskStatusEnum], string>;

const priorityVariantEntries = Object.fromEntries(
  Object.values(TaskPriorityEnum).map((priority) => [
    priority,
    TASK_PRIORITY_CONFIG[priority].badgeClass,
  ])
) as Record<(typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum], string>;

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        ...statusVariantEntries,
        ...priorityVariantEntries,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
