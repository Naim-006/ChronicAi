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
        const w = containerRef.current.clientWidth;
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

  // Precise geometry matching reference image
  const H = 78;
  const topBaseline = 24;
  const bottom = 76;
  const capRadius = (bottom - topBaseline) / 2; // 26px rounded stadium pill ends
  const cx = width / 2;
  const domeHalf = 44; // width of dome from center
  const domePeakY = 2; // apex of center dome

  // Smooth C1-continuous SVG path with horizontal tangents
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
    <nav className="fixed bottom-3 left-0 right-0 z-50 mx-auto w-full max-w-[410px] px-3 pointer-events-none lg:hidden">
      <div
        ref={containerRef}
        className="pointer-events-auto relative w-full h-[78px] select-none"
      >
        {/* Custom SVG Background with Continuous Dark Navy Border & Center Dome */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible drop-shadow-[0_10px_25px_rgba(30,41,59,0.14)]"
          width="100%"
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={svgPath}
            fill="#ffffff"
            stroke="#2B364A"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* 5 Tab Navigation Items in strict aligned columns */}
        <div className="relative z-10 grid grid-cols-5 h-full w-full">
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

            // Center Copilot Tab: Elevated green circular button framed inside the dome
            if (tab.isCenterCopilot) {
              return (
                <div
                  key={tab.name}
                  className="flex flex-col items-center justify-end h-full pb-2 relative"
                >
                  <Link
                    href={tab.href!}
                    aria-label="Chronic AI Copilot"
                    className="flex flex-col items-center justify-center group active:scale-95 transition-transform"
                  >
                    <div
                      className={cn(
                        "flex h-[46px] w-[46px] items-center justify-center rounded-full bg-gradient-to-tr from-[#059669] to-[#10b981] text-white shadow-[0_6px_16px_rgba(16,185,129,0.38)] transition-all mb-1",
                        isActive
                          ? "ring-2 ring-emerald-400 ring-offset-2 scale-105"
                          : "group-hover:scale-105"
                      )}
                    >
                      <Icon className="h-5 w-5 stroke-[2.3] text-white" />
                    </div>
                    <span
                      className={cn(
                        "text-[10.5px] leading-none tracking-tight",
                        isActive ? "font-semibold text-[#059669]" : "font-medium text-[#475569]"
                      )}
                    >
                      Copilot
                    </span>
                    <span className="mt-1 h-[3px] w-3.5 rounded-full bg-transparent" />
                  </Link>
                </div>
              );
            }

            // Normal Tab (Home, Records, Meds, Chronic Care)
            return (
              <div
                key={tab.name}
                className="flex flex-col items-center justify-end h-full pb-2"
              >
                <Link
                  href={tab.href!}
                  className="flex flex-col items-center justify-center w-full group active:scale-95 transition-transform"
                >
                  <div className="h-[24px] flex items-center justify-center relative mb-1">
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-transform",
                        isActive
                          ? "stroke-[2.2] text-[#059669] scale-105"
                          : "stroke-[1.8] text-[#475569] group-hover:scale-105"
                      )}
                    />

                    {/* Notification badge on Records */}
                    {tab.badge && (
                      <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#059669] px-0.5 text-[8.5px] font-bold text-white shadow-sm ring-1 ring-white">
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-[10.5px] leading-none tracking-tight text-center whitespace-nowrap",
                      isActive ? "font-semibold text-[#059669]" : "font-medium text-[#475569]"
                    )}
                  >
                    {tab.name}
                  </span>

                  {/* Active Indicator Bar */}
                  <span
                    className={cn(
                      "mt-1 h-[3px] w-3.5 rounded-full transition-colors",
                      isActive ? "bg-[#059669]" : "bg-transparent"
                    )}
                  />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
