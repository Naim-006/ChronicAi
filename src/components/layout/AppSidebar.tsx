"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderArchive,
  Clock,
  Stethoscope,
  Pill,
  CalendarDays,
  LineChart,
  HeartPulse,
  UserCheck,
  UserRound,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const primaryNav: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Medical Records", href: "/vault", icon: FolderArchive, badge: "1 new" },
  { name: "Medical Timeline", href: "/timeline", icon: Clock },
  { name: "Clinical Copilot", href: "/assistant", icon: Stethoscope },
  { name: "Medications", href: "/medications", icon: Pill },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Health Analytics", href: "/metrics", icon: LineChart },
];

const secondaryNav: NavItem[] = [
  { name: "Chronic Care", href: "/chronic-care", icon: HeartPulse },
  { name: "Doctors", href: "/doctors", icon: UserCheck },
  { name: "Health Profile", href: "/profile", icon: UserRound },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 z-30 select-none",
        collapsed ? "w-18" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 block leading-tight">
                Universal Medical AI
              </span>
              <span className="text-[10px] font-medium text-teal-700 block tracking-wide">
                LIFELONG HEALTH
              </span>
            </div>
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </Link>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {!collapsed && (
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Primary Care
            </span>
          )}
          <nav className="mt-2 space-y-1">
            {primaryNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-700 rounded-l-none"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-teal-700" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          {!collapsed && (
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Management & Tools
            </span>
          )}
          <nav className="mt-2 space-y-1">
            {secondaryNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-700 rounded-l-none"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-teal-700" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/50">
        {!collapsed ? (
          <div className="text-[11px] text-slate-500 leading-tight">
            <span className="font-semibold text-slate-700 block mb-0.5">Clinical Disclaimer</span>
            Informational health companion. Not a replacement for a licensed physician.
          </div>
        ) : (
          <div className="flex justify-center text-slate-400" title="Informational health companion">
            <ShieldCheck className="h-4 w-4" />
          </div>
        )}
      </div>
    </aside>
  );
}
