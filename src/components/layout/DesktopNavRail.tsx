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
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    title: "Care",
    items: [
      { name: "Home", href: "/dashboard", icon: Home },
      { name: "Records", href: "/vault", icon: FileText, badge: "1" },
      { name: "Timeline", href: "/timeline", icon: Clock },
      { name: "Copilot", href: "/assistant", icon: Stethoscope, highlight: true },
    ],
  },
  {
    title: "Health",
    items: [
      { name: "Analytics", href: "/metrics", icon: Activity },
      { name: "Medications", href: "/medications", icon: Pill },
      { name: "Appointments", href: "/appointments", icon: Calendar },
      { name: "Chronic Care", href: "/chronic-care", icon: HeartPulse },
    ],
  },
  {
    title: "You",
    items: [
      { name: "Profile", href: "/profile", icon: User },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function DesktopNavRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-[272px] shrink-0 flex-col border-r border-[var(--border)]/80 bg-white/90 backdrop-blur-xl select-none">
      <div className="flex h-[72px] items-center px-5 border-b border-[var(--border)]/70">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-600/25 transition-transform group-hover:scale-[1.03]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[15px] font-extrabold tracking-tight text-[var(--foreground)] leading-none">
              ChronicAI
            </span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
              Lifelong Care
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {navSections.map((sec) => (
          <div key={sec.title}>
            <span className="mb-2 block px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {sec.title}
            </span>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold transition-all group",
                      isActive
                        ? "bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-100"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                          isActive
                            ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-600/20"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className="rounded-lg bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
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

      <div className="border-t border-[var(--border)]/70 p-4">
        <Link
          href="/profile"
          className="soft-inset flex items-center justify-between rounded-2xl p-2.5 transition-all hover:bg-white group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-sm font-bold text-white shadow-sm">
              EV
            </div>
            <div>
              <span className="block text-xs font-bold text-[var(--foreground)] leading-tight">
                Elena Vance
              </span>
              <span className="block text-[10px] text-[var(--muted-foreground)]">
                Age 48 · Managed care
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </aside>
  );
}
