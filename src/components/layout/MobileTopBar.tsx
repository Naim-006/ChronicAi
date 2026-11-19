"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu } from "lucide-react";
import { useMobileNav } from "./MobileNavContext";

const pageTitles: Record<string, { title: string; parent?: string }> = {
  "/dashboard": { title: "Home" },
  "/vault": { title: "Medical Records", parent: "/dashboard" },
  "/timeline": { title: "Timeline", parent: "/dashboard" },
  "/assistant": { title: "Clinical Copilot", parent: "/dashboard" },
  "/appointments": { title: "Appointments", parent: "/dashboard" },
  "/medications": { title: "Medications", parent: "/dashboard" },
  "/metrics": { title: "Health Analytics", parent: "/dashboard" },
  "/chronic-care": { title: "Chronic Care", parent: "/dashboard" },
  "/evaluation": { title: "Health Evaluation", parent: "/dashboard" },
  "/notifications": { title: "Notifications", parent: "/dashboard" },
  "/profile": { title: "Profile", parent: "/dashboard" },
  "/summaries": { title: "Summaries", parent: "/dashboard" },
  "/settings": { title: "Settings", parent: "/dashboard" },
  "/doctors": { title: "Doctors", parent: "/dashboard" },
};

export function MobileTopBar() {
  const pathname = usePathname();
  const { openDrawer } = useMobileNav();
  const pageMeta = pageTitles[pathname] || { title: "ChronicAI" };
  const isDashboard = pathname === "/dashboard" || pathname === "/";

  return (
    <>
      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-30 flex h-16 w-full max-w-full items-center justify-between border-b border-[var(--border)]/70 bg-white/85 px-3.5 sm:px-6 backdrop-blur-xl lg:hidden">
        {/* Left Side: Menu Button + Page Context */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={openDrawer}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-xs text-slate-800 hover:bg-slate-50 hover:border-emerald-300 transition-all active:scale-95 cursor-pointer"
            title="Open Menu"
            aria-label="Open Menu"
          >
            {/* Modern Staggered Pill Menu Icon */}
            <svg
              className="h-4.5 w-4.5 text-slate-800"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2.5" y="4" width="15" height="2" rx="1" fill="currentColor" />
              <rect x="2.5" y="9" width="10" height="2" rx="1" fill="currentColor" />
              <rect x="2.5" y="14" width="13" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-sm sm:text-base font-extrabold text-[var(--foreground)] leading-tight">
              {isDashboard ? "ChronicAI" : pageMeta.title}
            </h1>
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
              Lifelong Care Intelligence
            </span>
          </div>
        </div>

        {/* Right Side: Notification Icon + Profile Icon (No name, only avatar icon) */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--foreground)] transition-colors hover:bg-[var(--mint-deep)]"
            title="Notifications & Alerts"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </Link>

          <Link
            href="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-xs font-bold text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-100 transition-transform active:scale-95"
            title="Profile & Medical ID"
            aria-label="Profile"
          >
            EV
          </Link>
        </div>
      </header>

      {/* Desktop top bar */}
      <header className="sticky top-0 z-30 hidden h-[72px] w-full items-center justify-between border-b border-[var(--border)]/70 bg-white/80 px-8 backdrop-blur-xl lg:flex">
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">
            {isDashboard ? "Health Overview" : pageMeta.title}
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            {isDashboard
              ? "Your vitals, meds, and visits in one calm view"
              : "Secure lifelong health workspace"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden xl:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="search"
              placeholder="Search records, meds, visits…"
              className="h-11 w-72 rounded-2xl border border-[var(--border)] bg-[var(--muted)] pl-10 pr-4 text-sm outline-none transition-all placeholder:text-[var(--muted-foreground)] focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <Link
            href="/notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
            title="Notifications & Alerts"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </Link>

          <Link
            href="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-xs font-bold text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-100 transition-transform hover:scale-105"
            title="Elena Vance · Profile"
            aria-label="Profile"
          >
            EV
          </Link>
        </div>
      </header>
    </>
  );
}
