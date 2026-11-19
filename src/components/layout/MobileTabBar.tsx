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
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Heart,
    matchExact: true,
  },
  {
    name: "Records",
    href: "/vault",
    icon: FolderArchive,
    badge: "1",
  },
  {
    name: "AI Health",
    href: "/assistant",
    icon: Sparkles,
    highlight: true,
  },
  {
    name: "Health Hub",
    href: "/metrics",
    icon: Activity,
    aliases: ["/timeline", "/medications", "/chronic-care", "/appointments"],
  },
  {
    name: "Profile",
    href: "/profile",
    icon: UserRound,
    aliases: ["/doctors", "/summaries", "/settings"],
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-lg safe-bottom">
      <div className="flex h-16 items-center justify-around px-2 max-w-md mx-auto">
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
                className="flex flex-col items-center justify-center -mt-3 group"
              >
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full shadow-md transition-transform active:scale-95",
                    isActive
                      ? "bg-teal-700 text-white ring-4 ring-teal-50"
                      : "bg-teal-700 text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold mt-1",
                    isActive ? "text-teal-800" : "text-slate-600"
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-1 px-3 text-center transition-colors min-w-[56px]",
                isActive ? "text-teal-800 font-semibold" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110 stroke-[2.2]"
                  )}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-1 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 leading-none">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
