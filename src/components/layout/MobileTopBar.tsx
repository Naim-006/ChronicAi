"use client";

import React from "react";
import Link from "next/link";
import { Bell, Sparkles, ShieldAlert, Search } from "lucide-react";

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white font-bold text-sm shadow-sm ring-2 ring-emerald-100">
            EV
          </div>
          <div className="text-left">
            <span className="text-[11px] font-medium text-slate-400 block leading-tight">
              Good Morning,
            </span>
            <span className="text-sm font-extrabold text-slate-900 block leading-tight">
              Elena Vance
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/assistant"
          className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Ask</span> AI
        </Link>

        <Link
          href="/vault"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 border border-slate-200/70 text-slate-600 hover:bg-slate-100 transition-colors relative"
          title="Documents"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </Link>
      </div>
    </header>
  );
}
