"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderArchive,
  Stethoscope,
  Calendar,
  User,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Home,
    matchExact: true,
  },
  {
    name: "Records",
    href: "/vault",
    icon: FolderArchive,
    badge: "1",
  },
  {
    name: "Copilot",
    href: "/assistant",
    icon: Stethoscope,
    highlight: true,
  },
  {
    name: "Visits",
    href: "/appointments",
    icon: Calendar,
    aliases: ["/timeline", "/metrics", "/chronic-care", "/medications"],
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    aliases: ["/doctors", "/summaries", "/settings"],
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-3 right-3 z-50 lg:hidden max-w-md mx-auto pointer-events-auto">
      <div className="flex h-16 items-center justify-around rounded-full border border-slate-200/80 bg-white/95 px-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive =
            (tab.matchExact && pathname === tab.href) ||
            (!tab.matchExact && pathname === tab.href) ||
            (tab.aliases && tab.aliases.some((alias) => pathname.startsWith(alias)));

          const Icon = tab.icon;

          if (tab.highlight) {
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="flex flex-col items-center justify-center -mt-6 group"
              >
                <div
                  className={cn(
                    "flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-500/30 transition-transform active:scale-95",
                    isActive ? "ring-4 ring-emerald-100 scale-105" : "hover:scale-105"
                  )}
                >
                  <Icon className="h-6 w-6 stroke-[2.2]" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold mt-1 tracking-tight",
                    isActive ? "text-emerald-700" : "text-slate-600"
                  )}
                >
                  Copilot
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-1 px-3 text-center transition-all",
                isActive
                  ? "text-emerald-600 font-bold"
                  : "text-slate-400 hover:text-slate-700"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive ? "scale-110 stroke-[2.2]" : "stroke-[1.7]"
                  )}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-extrabold text-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1 leading-none">
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
