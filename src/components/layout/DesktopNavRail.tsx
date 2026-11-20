"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Stethoscope,
  Activity,
  Calendar,
  Pill,
  Clock,
  HeartPulse,
  User,
  ShieldCheck,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: "purple" | "emerald";
  highlight?: boolean;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Main",
    items: [
      { name: "Home", href: "/dashboard", icon: Home },
      {
        name: "Clinical Copilot",
        href: "/assistant",
        icon: Stethoscope,
        badge: "+ New",
        badgeColor: "purple",
      },
    ],
  },
  {
    title: "RECORDS",
    items: [
      { name: "Medical Records", href: "/vault", icon: FileText },
      { name: "Medical Timeline", href: "/timeline", icon: Clock },
    ],
  },
  {
    title: "HEALTH",
    items: [
      { name: "Chronic Care", href: "/chronic-care", icon: ShieldCheck },
      { name: "Health Analytics", href: "/metrics", icon: Activity },
      { name: "Medications", href: "/medications", icon: Pill },
      { name: "Appointments", href: "/appointments", icon: Calendar },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Health Profile", href: "/profile", icon: User },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function DesktopNavRail() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();
  const { user, profile } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Patient";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentAvatar =
    profile?.avatar_url ||
    (profile?.preferences as any)?.avatar_url ||
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    null;

  const getLocalizedName = (href: string, fallback: string) => {
    switch (href) {
      case "/dashboard": return t("nav.home", fallback);
      case "/assistant": return "Clinical Copilot";
      case "/vault": return "Medical Records";
      case "/timeline": return "Medical Timeline";
      case "/chronic-care": return "Chronic Care";
      case "/metrics": return "Health Analytics";
      case "/medications": return "Medications";
      case "/appointments": return "Appointments";
      case "/notifications": return "Notifications";
      case "/profile": return "Health Profile";
      case "/settings": return "Settings";
      default: return fallback;
    }
  };

  return (
    <aside className={cn(
      "hidden lg:flex shrink-0 flex-col border-r border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#070d18]/90 backdrop-blur-2xl select-none transition-all duration-300 z-20",
      isCollapsed ? "w-[72px]" : "w-[270px]"
    )}>
      {/* Brand Header */}
      <div className="flex h-[72px] items-center px-5 border-b border-slate-200/60 dark:border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 transition-transform group-hover:scale-105">
            <Activity className="h-5 w-5 stroke-[2.5]" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="block text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                Chronic<span className="text-emerald-500 dark:text-emerald-400">AI</span>
              </span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400/90">
                LIFELONG CARE
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center justify-between mb-1.5 px-3">
              {!isCollapsed && (
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {section.title}
                </span>
              )}
              {section.title === "Main" && (
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
                  title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-3.5 w-3.5" />
                  ) : (
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all group",
                      isActive
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-xs dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 dark:shadow-[0_0_16px_rgba(16,185,129,0.2)]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white border border-transparent",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? getLocalizedName(item.href, item.name) : undefined}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white"
                    )} />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{getLocalizedName(item.href, item.name)}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className={cn(
                        "text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border shrink-0",
                        item.badgeColor === "purple"
                          ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-500/40 dark:shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                          : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile & Version */}
      <div className="border-t border-slate-200/60 dark:border-white/[0.06] p-3">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-2.5 rounded-xl p-2 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.06]",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Profile" : undefined}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-slate-950 shadow-sm overflow-hidden">
            {currentAvatar ? (
              <img src={currentAvatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initials || "A"
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="block truncate text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {displayName}
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                Health Profile
              </span>
            </div>
          )}
        </Link>
        {!isCollapsed && (
          <p className="mt-2 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
            v2.0.0 • Caring for a healthier you 💚
          </p>
        )}
      </div>
    </aside>
  );
}
