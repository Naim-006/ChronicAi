"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeftRight,
  ShieldCheck,
  FolderHeart,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface DoctorNavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: "purple" | "emerald" | "amber";
}

const doctorNavSections: { title: string; items: DoctorNavItem[] }[] = [
  {
    title: "Clinical Core",
    items: [
      { name: "Dashboard", href: "/doctor/dashboard", icon: Home },
      {
        name: "Live Queue",
        href: "/doctor/queue",
        icon: Users,
        badge: "Live",
        badgeColor: "emerald",
      },
    ],
  },
  {
    title: "Care & Records",
    items: [
      { name: "Patients", href: "/doctor/patients", icon: FolderHeart },
      { name: "Consultations & Rx", href: "/doctor/consultations", icon: FileText },
      { name: "Follow-ups Due", href: "/doctor/follow-ups", icon: Calendar },
    ],
  },
  {
    title: "Portal Switch",
    items: [
      {
        name: "Patient Portal",
        href: "/dashboard",
        icon: ArrowLeftRight,
        badge: "Patient Mode",
        badgeColor: "purple",
      },
      { name: "Account Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function DoctorNavRail() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();
  const { user, profile, doctorProfile, isDoctor } = useAuth();

  const doctorName =
    doctorProfile?.full_name ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    "Doctor";
  const doctorSpecialty = doctorProfile?.specialty || "General Physician";
  const bmdcNo = doctorProfile?.bmdc_number || "Verified BMDC";

  const initials = doctorName
    .replace(/^Dr\.\s+/i, "")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentAvatar =
    profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string) ||
    null;

  const getLocalizedName = (href: string, fallback: string) => {
    switch (href) {
      case "/doctor/dashboard":
        return t("doctor.nav.dashboard", fallback);
      case "/doctor/queue":
        return t("doctor.nav.queue", fallback);
      case "/doctor/patients":
        return t("doctor.nav.patients", fallback);
      case "/doctor/consultations":
        return t("doctor.nav.consultations", fallback);
      case "/doctor/follow-ups":
        return t("doctor.nav.followups", fallback);
      case "/dashboard":
        return t("doctor.nav.switch_to_patient", fallback);
      default:
        return fallback;
    }
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col border-r border-slate-200/80 dark:border-white/[0.08] bg-white/85 dark:bg-[#070d18]/90 backdrop-blur-2xl select-none transition-all duration-300 z-20",
        isCollapsed ? "w-[72px]" : "w-[270px]"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-[72px] items-center px-5 border-b border-slate-200/60 dark:border-white/[0.06] justify-between">
        <Link href="/doctor/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/80 p-0.5 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="ChronicAI Logo"
              width={46}
              height={30}
              className="object-contain w-full h-full scale-110"
              priority
            />
          </div>
          {!isCollapsed && (
            <div>
              <span className="block text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                Chronic<span className="text-emerald-500 dark:text-emerald-400">AI</span>
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300/50 dark:border-emerald-600/40 px-1.5 py-0.2 rounded-md">
                  CLINICAL
                </span>
                <span className="text-[9px] font-semibold text-slate-400">MD</span>
              </div>
            </div>
          )}
        </Link>
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {doctorNavSections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center justify-between mb-1.5 px-3">
              {!isCollapsed ? (
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {section.title}
                </span>
              ) : (
                section.title === "Clinical Core" && (
                  <button
                    type="button"
                    onClick={() => setIsCollapsed(false)}
                    className="flex h-6 w-6 mx-auto items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
                    title="Expand sidebar"
                  >
                    <PanelLeftOpen className="h-3.5 w-3.5" />
                  </button>
                )
              )}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/doctor/dashboard" &&
                    item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all group",
                      isActive
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-xs dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 dark:shadow-[0_0_14px_rgba(16,185,129,0.18)]"
                        : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white border border-transparent",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? getLocalizedName(item.href, item.name) : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1">
                        {getLocalizedName(item.href, item.name)}
                      </span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          "text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border shrink-0",
                          item.badgeColor === "purple"
                            ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-500/40"
                            : item.badgeColor === "amber"
                            ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/40"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40"
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
        ))}
      </div>

      {/* Footer Doctor Profile & Verification */}
      <div className="border-t border-slate-200/60 dark:border-white/[0.06] p-3">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl p-2 transition-all bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.04]",
            isCollapsed && "justify-center p-1.5"
          )}
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm overflow-hidden">
            {currentAvatar ? (
              <img src={currentAvatar} alt={doctorName} className="h-full w-full object-cover" />
            ) : (
              initials || "DR"
            )}
            {isDoctor && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-white" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="block truncate text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {doctorName}
                </span>
                {isDoctor && (
                  <span title="Verified Practitioner">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                  </span>
                )}
              </div>
              <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
                {doctorSpecialty} · {bmdcNo}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
