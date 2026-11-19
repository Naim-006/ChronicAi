"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Stethoscope,
  ChevronLeft,
  Search,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, { title: string; parent?: string }> = {
  "/dashboard": { title: "Universal Medical" },
  "/vault": { title: "Medical Vault", parent: "/dashboard" },
  "/timeline": { title: "Lifelong Timeline", parent: "/dashboard" },
  "/assistant": { title: "Clinical Copilot", parent: "/dashboard" },
  "/appointments": { title: "Visits & Doctors", parent: "/dashboard" },
  "/medications": { title: "Prescriptions & Dosing", parent: "/dashboard" },
  "/metrics": { title: "Health Analytics", parent: "/dashboard" },
  "/chronic-care": { title: "Chronic Care Protocol", parent: "/dashboard" },
  "/profile": { title: "Health Profile", parent: "/dashboard" },
  "/summaries": { title: "Clinical Summaries", parent: "/dashboard" },
  "/settings": { title: "Preferences", parent: "/dashboard" },
};

export function MobileTopBar() {
  const pathname = usePathname();
  const pageMeta = pageTitles[pathname] || { title: "Universal Medical" };
  const isDashboard = pathname === "/dashboard" || pathname === "/";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: User or Back Button */}
      <div className="flex items-center gap-3">
        {!isDashboard ? (
          <div className="flex items-center gap-2">
            <Link
              href={pageMeta.parent || "/dashboard"}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                {pageMeta.title}
              </h1>
              <span className="text-[10px] font-semibold text-emerald-600 block uppercase tracking-wider">
                Personal Health Companion
              </span>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* Right: Clinical Action & Notification */}
      <div className="flex items-center gap-2">
        {pathname !== "/assistant" && (
          <Link
            href="/assistant"
            className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
            <span>Consult Copilot</span>
          </Link>
        )}

        <Link
          href="/vault"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 border border-slate-200/70 text-slate-600 hover:bg-slate-100 transition-colors relative"
          title="Medical Notifications & Documents"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </Link>
      </div>
    </header>
  );
}
