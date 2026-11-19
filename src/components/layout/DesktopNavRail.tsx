"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  FolderArchive,
  Sparkles,
  Activity,
  UserRound,
  ShieldCheck,
  Clock,
  Pill,
  CalendarDays,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { name: "Home", href: "/dashboard", icon: Heart },
  { name: "Records", href: "/vault", icon: FolderArchive, badge: "1" },
  { name: "AI Health", href: "/assistant", icon: Sparkles, highlight: true },
  { name: "Health Analytics", href: "/metrics", icon: Activity },
  { name: "Medications", href: "/medications", icon: Pill },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Chronic Care", href: "/chronic-care", icon: HeartPulse },
  { name: "Profile", href: "/profile", icon: UserRound },
];

export function DesktopNavRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-md select-none shrink-0">
      {/* App Header */}
      <div className="flex h-16 items-center px-5 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 text-white shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 block leading-none">
              Universal Medical AI
            </span>
            <span className="text-[10px] font-semibold text-teal-800 tracking-wider block mt-1">
              PERSONAL HEALTH
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </span>
        <div className="mt-2 space-y-0.5">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-teal-800 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-slate-400"
                  )}
                />
                <span className="flex-1 truncate">{item.name}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[9px] font-bold",
                      isActive ? "bg-white text-teal-900" : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Patient Avatar Card in Footer */}
      <div className="p-3 border-t border-slate-100">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-100 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-900 font-bold text-xs shrink-0">
            EV
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-900 block truncate leading-none">
              Elena Vance
            </span>
            <span className="text-[10px] text-slate-400 block truncate mt-1">
              Age 64 • T2D / HTN / CKD2
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
