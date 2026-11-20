"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Home,
  FileText,
  Clock,
  Stethoscope,
  Activity,
  Pill,
  Calendar,
  Bell,
  User,
  Settings,
  ShieldCheck,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Main Navigation",
    items: [
      {
        name: "Home Overview",
        href: "/dashboard",
        icon: Home,
      },
      {
        name: "Clinical Copilot",
        href: "/assistant",
        icon: Stethoscope,
        highlight: true,
      },
    ],
  },
  {
    title: "Medical Records",
    items: [
      {
        name: "Records",
        href: "/vault",
        icon: FileText,
      },
      {
        name: "Health Timeline",
        href: "/timeline",
        icon: Clock,
      },
    ],
  },
  {
    title: "Clinical Care",
    items: [
      {
        name: "Chronic Care Hub",
        href: "/chronic-care",
        icon: ShieldCheck,
      },
      {
        name: "Biomarker Analytics",
        href: "/metrics",
        icon: Activity,
      },
      {
        name: "Medication Regimen",
        href: "/medications",
        icon: Pill,
      },
      {
        name: "Appointments",
        href: "/appointments",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Settings & Account",
    items: [
      {
        name: "Care Notifications",
        href: "/notifications",
        icon: Bell,
        badge: "3",
      },
      {
        name: "Patient Profile",
        href: "/profile",
        icon: User,
      },
      {
        name: "App Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, profile } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Patient";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const getLocalizedName = (href: string, fallback: string) => {
    switch (href) {
      case "/dashboard": return t("nav.home", fallback);
      case "/assistant": return t("nav.copilot", fallback);
      case "/vault": return t("nav.records", fallback);
      case "/timeline": return t("nav.timeline", fallback);
      case "/chronic-care": return t("nav.chronic_care", fallback);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-200">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Left Sidebar Drawer */}
      <div className="relative z-10 h-full w-[285px] max-w-[85vw] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-left duration-250">
        {/* Compact Clean Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/50 to-white dark:from-emerald-950/40 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-extrabold tracking-tight text-slate-900 leading-none">
                ChronicAI
              </span>
              <span className="mt-0.5 block text-[9.5px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                Care Intelligence
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Groups with Proper Sizing & Tight Spacing */}
        <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              <span className="block px-2 mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {group.title}
              </span>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  // Highlighting for Clinical Copilot
                  if (item.highlight) {
                    return (
                      <Link
                        key={item.name}
                        href={item.href!}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all group relative overflow-hidden",
                          isActive
                            ? "bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-xs"
                            : "bg-emerald-50/50 text-emerald-800 hover:bg-emerald-50 border border-emerald-100"
                        )}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                          <Icon className="h-3.5 w-3.5 stroke-[2.2]" />
                        </div>
                        <span className="flex-1">{getLocalizedName(item.href, item.name)}</span>
                        <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      </Link>
                    );
                  }

                  // Normal Menu Item
                  return (
                    <Link
                      key={item.name}
                      href={item.href!}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs transition-all group relative",
                        isActive
                          ? "bg-emerald-50/90 text-emerald-900 font-bold border border-emerald-200/70 shadow-xs"
                          : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg transition-colors shrink-0",
                          isActive
                            ? "bg-emerald-100/80 text-emerald-700"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-700"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <span className="flex-1 truncate">{getLocalizedName(item.href, item.name)}</span>

                      {/* Optional Badge */}
                      {item.badge && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                          {item.badge}
                        </span>
                      )}

                      {/* Active indicator dot */}
                      {isActive && !item.badge && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Compact Profile Footer */}
        <div className="border-t border-slate-100 p-2.5 bg-slate-50/50">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-xl p-2 transition-all hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[11px] font-bold text-white shadow-xs ring-2 ring-emerald-100 shrink-0">
              {initials || "PT"}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-slate-900 leading-tight truncate">
                {displayName}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">
                Verified Medical ID
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
