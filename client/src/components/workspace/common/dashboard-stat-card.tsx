import { Link } from "react-router-dom";
import { Loader, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardStatCardProps = {
  label: string;
  value: number;
  isLoading: boolean;
  icon: LucideIcon;
  containerClassName: string;
  iconClassName: string;
  valueClassName?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  href?: string;
  showPulse?: boolean;
};

export default function DashboardStatCard({
  label,
  value,
  isLoading,
  icon: Icon,
  containerClassName,
  iconClassName,
  valueClassName,
  subtitle,
  footer,
  href,
  showPulse = false,
}: DashboardStatCardProps) {
  const content = (
    <div
      className={cn(
        "relative flex h-full min-h-[140px] flex-col rounded-xl border border-transparent p-5 shadow-sm transition-transform duration-200 hover:scale-105",
        containerClassName,
        href && "cursor-pointer"
      )}
    >
      {showPulse && value > 0 && (
        <span
          className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"
          aria-hidden
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col justify-end space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-3xl font-bold tracking-tight tabular-nums",
            valueClassName
          )}
        >
          {isLoading ? (
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            value
          )}
        </p>
        {subtitle && !isLoading && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {footer && !isLoading && <div className="pt-2">{footer}</div>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        to={href}
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}
