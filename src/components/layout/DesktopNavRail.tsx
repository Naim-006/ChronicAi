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

const navSections = [
  {
    title: "Main",
    items: [
      { name: "Home", href: "/dashboard", icon: Home },
      { name: "Copilot", href: "/assistant", icon: Stethoscope, highlight: true },
    ],
  },
  {
    title: "Records",
    items: [
      { name: "Medical Records", href: "/vault", icon: FileText },
      { name: "Timeline", href: "/timeline", icon: Clock },
    ],
  },
  {
    title: "Health",
    items: [
      { name: "Evaluation", href: "/evaluation", icon: HeartPulse },
      { name: "Analytics", href: "/metrics", icon: Activity },
      { name: "Medications", href: "/medications", icon: Pill },
      { name: "Appointments", href: "/appointments", icon: Calendar },
      { name: "Chronic Care", href: "/chronic-care", icon: ShieldCheck },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Profile", href: "/profile", icon: User },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function DesktopNavRail() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  const getLocalizedName = (href: string, fallback: string) => {
    switch (href) {
      case "/dashboard": return t("nav.home", fallback);
      case "/assistant": return t("nav.copilot", fallback);
      case "/vault": return t("nav.records", fallback);
      case "/timeline": return t("nav.timeline", fallback);
      case "/evaluation": return t("nav.chronic_care", fallback);
      case "/metrics": return t("nav.analytics", fallback);
      case "/medications": return t("nav.meds", fallback);
      case "/appointments": return t("nav.appointments", fallback);
      case "/chronic-care": return t("nav.chronic_care", fallback);
      case "/notifications": return t("nav.notifications", "Notifications");
      case "/profile": return t("nav.profile", fallback);
      case "/settings": return t("nav.settings", fallback);
      default: return fallback;
    }
  };

  return (
    <aside className={cn(
      "hidden lg:flex shrink-0 flex-col border-r border-[var(--border)] bg-white/95 backdrop-blur-xl select-none transition-all duration-300",
      isCollapsed ? "w-[72px]" : "w-[280px]"
    )}>
      <div className="flex h-[72px] items-center px-5 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-transform group-hover:scale-[1.02]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="block text-[15px] font-extrabold tracking-tight text-[var(--foreground)] leading-none">
                ChronicAI
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                Lifelong Care
              </span>
            </div>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center justify-between mb-2 px-3">
              {!isCollapsed && (
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  {section.title}
                </span>
              )}
              {section.title === "Main" && (
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                  title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
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
                      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group",
                      isActive
                        ? "bg-emerald-50 text-emerald-900 shadow-sm"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]",
                      isCollapsed && "justify-center px-2.5"
                    )}
                    title={isCollapsed ? getLocalizedName(item.href, item.name) : undefined}
                  >
                    <Icon className={cn(
                      "h-4.5 w-4.5",
                      isActive ? "text-emerald-600" : "text-[var(--muted-foreground)]"
                    )} />
                    {!isCollapsed && <span>{getLocalizedName(item.href, item.name)}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--border)] p-4">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-[var(--secondary)]",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Profile" : undefined}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-xs font-bold text-white shadow-md shadow-emerald-500/20">
            EV
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <span className="block text-xs font-semibold text-[var(--foreground)] leading-tight">
                Elena Vance
              </span>
              <span className="block text-[10px] text-[var(--muted-foreground)]">
                Profile
              </span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
