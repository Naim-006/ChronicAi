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
    aliases: ["/timeline", "/summaries"],
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
    aliases: ["/medications", "/metrics", "/chronic-care", "/doctors"],
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    aliases: ["/settings"],
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-3 right-3 z-50 mx-auto max-w-md pointer-events-none lg:hidden">
      <div className="pointer-events-auto flex h-[68px] items-center justify-around rounded-[28px] border border-white/10 bg-[var(--forest)]/95 px-2 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        {tabs.map((tab) => {
          const isActive =
            (tab.matchExact && pathname === tab.href) ||
            (!tab.matchExact &&
              !tab.highlight &&
              (pathname === tab.href ||
                (tab.aliases &&
                  tab.aliases.some((alias) => pathname.startsWith(alias))))) ||
            (tab.highlight && pathname.startsWith(tab.href));

          const Icon = tab.icon;

          if (tab.highlight) {
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="group -mt-7 flex flex-col items-center justify-center"
              >
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-500/40 transition-transform active:scale-95",
                    isActive ? "ring-4 ring-emerald-400/30 scale-105" : "hover:scale-105"
                  )}
                >
                  <Icon className="h-6 w-6 stroke-[2.2]" />
                </div>
                <span
                  className={cn(
                    "mt-1 text-[10px] font-bold tracking-tight",
                    isActive ? "text-emerald-400" : "text-white/70"
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
                "relative flex flex-col items-center justify-center px-3 py-1 text-center transition-all",
                isActive
                  ? "text-white font-bold"
                  : "text-white/45 hover:text-white/90"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive ? "scale-110 stroke-[2.3]" : "stroke-[1.8]"
                  )}
                />
                {tab.badge && (
                  <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-extrabold text-white">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="mt-1 text-[10px] font-medium leading-none">
                {tab.name}
              </span>

              {isActive && (
                <span className="absolute -bottom-0.5 h-1 w-4 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
