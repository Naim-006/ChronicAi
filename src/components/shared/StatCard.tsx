import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  status?: "normal" | "warning" | "alert" | "neutral";
  className?: string;
  children?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  status = "neutral",
  className,
  children,
}: StatCardProps) {
  const statusColors = {
    normal: "text-emerald-700 bg-emerald-50",
    warning: "text-amber-700 bg-amber-50",
    alert: "text-rose-700 bg-rose-50",
    neutral: "text-[var(--muted-foreground)] bg-[var(--muted)]",
  };

  return (
    <div
      className={cn(
        "soft-card flex flex-col justify-between p-4 transition-all hover:border-emerald-200 sm:p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--foreground)]">{title}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", statusColors[status])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-[var(--muted-foreground)]">{unit}</span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-1.5 flex items-center justify-between text-[11px]">
          {subtitle && (
            <span className="font-semibold text-emerald-600">{subtitle}</span>
          )}
          {trend && (
            <span
              className={cn(
                "font-semibold",
                trend.isPositive
                  ? "text-emerald-600"
                  : trend.isNeutral
                    ? "text-[var(--muted-foreground)]"
                    : "text-rose-600"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
