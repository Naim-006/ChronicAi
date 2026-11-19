"use client";

import React from "react";
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
  FileSpreadsheet,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    title: "Core Platform",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Medical Records", href: "/vault", icon: FileText, badge: "1 New" },
      { name: "Medical Timeline", href: "/timeline", icon: Clock },
      { name: "Clinical Copilot", href: "/assistant", icon: Stethoscope, highlight: true },
    ],
  },
  {
    title: "Health & Treatment",
    items: [
      { name: "Health Analytics", href: "/metrics", icon: Activity },
      { name: "Prescriptions & Dosing", href: "/medications", icon: Pill },
      { name: "Doctors & Visits", href: "/appointments", icon: Calendar },
      { name: "Chronic Care Protocol", href: "/chronic-care", icon: HeartPulse },
    ],
  },
  {
    title: "Patient Services",
    items: [
      { name: "Health Profile", href: "/profile", icon: User },
      { name: "Clinical Summaries", href: "/summaries", icon: FileSpreadsheet },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function DesktopNavRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/70 bg-white select-none shrink-0 shadow-2xs">
      {/* Brand Header */}
      <div className="flex h-18 items-center px-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-md shadow-emerald-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-slate-900 block leading-none tracking-tight">
              Universal Medical
            </span>
            <span className="text-[10px] font-bold text-emerald-600 tracking-wider block mt-1 uppercase">
              Lifelong Healthcare
            </span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {navSections.map((sec) => (
          <div key={sec.title}>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {sec.title}
            </span>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all group",
                      isActive
                        ? "bg-emerald-50/90 text-emerald-900 font-bold shadow-2xs border-l-4 border-emerald-500"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-emerald-600 stroke-[2.2]" : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
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

      {/* Patient Profile Card at Bottom */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <Link
          href="/profile"
          className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs">
              EV
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Elena Vance
              </span>
              <span className="text-[10px] text-slate-500 block">
                Age 48 · ID #892-04
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </aside>
  );
}
