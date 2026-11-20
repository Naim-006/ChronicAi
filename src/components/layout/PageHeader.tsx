import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  eyebrow?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  eyebrow,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2.5 sm:mb-6 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <span className="mb-0.5 block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
            {eyebrow}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 max-w-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal hidden sm:block">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="mt-1 sm:mt-0 flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
