"use client";

import React from "react";
import Link from "next/link";
import { Bell, ShieldAlert, Sparkles, UserRound } from "lucide-react";

export function MobileTopBar() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <Link href="/profile" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-white font-bold text-xs shadow-xs">
            EV
          </div>
          <div className="text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block leading-tight">
              {today}
            </span>
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              Elena Vance
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/assistant"
          className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-teal-700" />
          <span>Ask AI</span>
        </Link>

        <Link
          href="/profile"
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Emergency Medical Card"
        >
          <ShieldAlert className="h-4 w-4 text-red-600" />
        </Link>
      </div>
    </header>
  );
}
