"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Folder,
  Stethoscope,
  Pill,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(380);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        if (w > 0) setWidth(w);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
      icon: Folder,
      badge: "1",
      aliases: ["/timeline", "/summaries"],
    },
    {
      name: "Copilot",
      href: "/assistant",
      icon: Stethoscope,
      isCenterCopilot: true,
    },
    {
      name: "Meds",
      href: "/medications",
      icon: Pill,
    },
    {
      name: "Chronic Care",
      href: "/chronic-care",
      icon: ShieldCheck,
      aliases: ["/evaluation"],
    },
  ];

  // SVG Geometry for the custom continuous outline with smooth center dome
  const H = 76;
  const topBaseline = 22;
  const bottom = 74;
  const capRadius = (bottom - topBaseline) / 2; // 26
  const cx = width / 2;
  const domeHalf = 48; // width of dome base from center
  const domePeakY = 3; // peak elevation of dome

  // Continuous smooth SVG path with horizontal tangents at junctions and peak
  const svgPath = `
    M ${capRadius}, ${topBaseline}
    L ${cx - domeHalf}, ${topBaseline}
    C ${cx - 24}, ${topBaseline} ${cx - 22}, ${domePeakY} ${cx}, ${domePeakY}
    C ${cx + 22}, ${domePeakY} ${cx + 24}, ${topBaseline} ${cx + domeHalf}, ${topBaseline}
    L ${width - capRadius}, ${topBaseline}
    A ${capRadius} ${capRadius} 0 0 1 ${width - capRadius}, ${bottom}
    L ${capRadius}, ${bottom}
    A ${capRadius} ${capRadius} 0 0 1 ${capRadius}, ${topBaseline}
    Z
  `.replace(/\s+/g, " ").trim();

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-50 mx-auto w-full max-w-md px-3 pointer-events-none lg:hidden">
      <div
        ref={containerRef}
        className="pointer-events-auto relative w-full h-[78px] select-none"
      >
        {/* Custom SVG Background with Continuous Dark Border & Center Dome */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible drop-shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={svgPath}
            fill="#ffffff"
            stroke="#334155"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* 5 Tab Navigation Items */}
        <div className="relative z-10 grid grid-cols-5 h-full items-end pb-2 pt-1 px-1">
          {tabs.map((tab) => {
            const isActive =
              (tab.matchExact && pathname === tab.href) ||
              (!tab.matchExact &&
                !tab.isCenterCopilot &&
                (pathname === tab.href ||
                  (tab.aliases &&
                    tab.aliases.some((alias) => pathname.startsWith(alias))))) ||
              (tab.isCenterCopilot && pathname.startsWith(tab.href!));

            const Icon = tab.icon;

            // Center Copilot Button with circular green gradient inside the dome
            if (tab.isCenterCopilot) {
              return (
                <div key={tab.name} className="flex flex-col items-center justify-end pb-0.5">
                  <Link
                    href={tab.href!}
                    aria-label="Chronic AI Copilot"
                    className="group -mt-8 flex flex-col items-center justify-center transition-transform active:scale-95"
                  >
                    <div
                      className={cn(
                        "flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-[0_6px_16px_rgba(16,185,129,0.42)] transition-all",
                        isActive
                          ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-white scale-105"
                          : "group-hover:scale-105"
                      )}
                    >
                      <Icon className="h-6 w-6 stroke-[2.2] text-white" />
                    </div>
                    <span
                      className={cn(
                        "mt-1 text-[11px] font-medium leading-none tracking-tight",
                        isActive ? "text-emerald-700 font-semibold" : "text-slate-600"
                      )}
                    >
                      Copilot
                    </span>
                  </Link>
                </div>
              );
            }

            // Normal Tab (Home, Records, Meds, Chronic Care)
            return (
              <Link
                key={tab.name}
                href={tab.href!}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1 transition-all group",
                  isActive
                    ? "text-emerald-600 font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isActive
                        ? "stroke-[2.2] text-emerald-600 scale-105"
                        : "stroke-[1.8] text-slate-700 group-hover:scale-105"
                    )}
                  />

                  {/* Badge (e.g. green circle '1' on Records) */}
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={cn(
                    "mt-1 text-[11px] leading-tight text-center tracking-tight",
                    isActive ? "font-semibold text-emerald-600" : "font-medium text-slate-600"
                  )}
                >
                  {tab.name}
                </span>

                {/* Active Indicator Bar (rounded pill like in screenshot) */}
                {isActive && (
                  <span className="mt-0.5 h-1 w-4 rounded-full bg-emerald-500 shadow-sm" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
