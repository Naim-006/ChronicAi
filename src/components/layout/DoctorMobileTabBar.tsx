"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FolderHeart, FileText, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const doctorTabs = [
  { name: "Dashboard", href: "/doctor/dashboard", icon: Home },
  { name: "Queue", href: "/doctor/queue", icon: Users, badge: "Live" },
  { name: "Patients", href: "/doctor/patients", icon: FolderHeart },
  { name: "Consults", href: "/doctor/consultations", icon: FileText },
  { name: "Follow-ups", href: "/doctor/follow-ups", icon: Calendar },
];

export function DoctorMobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 w-full items-center justify-around border-t border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#070d18]/95 px-2 backdrop-blur-xl lg:hidden">
      {doctorTabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== "/doctor/dashboard" && pathname.startsWith(tab.href));
        const Icon = tab.icon;

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all",
              isActive
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {tab.badge && (
                <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.name}</span>
            {isActive && (
              <span className="absolute -bottom-1 h-0.5 w-6 rounded-full bg-emerald-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
