"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Stethoscope, ChevronLeft, Search } from "lucide-react";

const pageTitles: Record<string, { title: string; parent?: string }> = {
  "/dashboard": { title: "Home" },
  "/vault": { title: "Medical Records", parent: "/dashboard" },
  "/timeline": { title: "Timeline", parent: "/dashboard" },
  "/assistant": { title: "Clinical Copilot", parent: "/dashboard" },
  "/appointments": { title: "Appointments", parent: "/dashboard" },
  "/medications": { title: "Medications", parent: "/dashboard" },
  "/metrics": { title: "Health Analytics", parent: "/dashboard" },
  "/chronic-care": { title: "Chronic Care", parent: "/dashboard" },
  "/profile": { title: "Profile", parent: "/dashboard" },
  "/summaries": { title: "Summaries", parent: "/dashboard" },
  "/settings": { title: "Settings", parent: "/dashboard" },
  "/doctors": { title: "Doctors", parent: "/dashboard" },
};

export function MobileTopBar() {
  const pathname = usePathname();
  const pageMeta = pageTitles[pathname] || { title: "ChronicAI" };
  const isDashboard = pathname === "/dashboard" || pathname === "/";

  return (
    <>
      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border)]/70 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          {!isDashboard ? (
            <div className="flex min-w-0 items-center gap-2.5">
              <Link
                href={pageMeta.parent || "/dashboard"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--foreground)] transition-colors hover:bg-[var(--mint-deep)]"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="truncate text-base font-extrabold text-[var(--foreground)] leading-tight">
                  {pageMeta.title}
                </h1>
                <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                  ChronicAI
                </span>
              </div>
            </div>
          ) : (
            <Link href="/profile" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-sm font-bold text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-100">
                EV
              </div>
              <div className="text-left">
                <span className="block text-[11px] font-medium text-[var(--muted-foreground)] leading-tight">
                  Good morning
                </span>
                <span className="block text-sm font-extrabold text-[var(--foreground)] leading-tight">
                  Elena Vance
                </span>
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {pathname !== "/assistant" && (
            <Link
              href="/assistant"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-100"
              title="Clinical Copilot"
            >
              <Stethoscope className="h-4 w-4" />
            </Link>
          )}

          <Link
            href="/vault"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--foreground)] transition-colors hover:bg-[var(--mint-deep)]"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
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

          {pathname !== "/assistant" && (
            <Link
              href="/assistant"
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 px-4 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-transform hover:scale-[1.02]"
            >
              <Stethoscope className="h-4 w-4" />
              Copilot
            </Link>
          )}

          <Link
            href="/vault"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </Link>
        </div>
      </header>
    </>
  );
}
