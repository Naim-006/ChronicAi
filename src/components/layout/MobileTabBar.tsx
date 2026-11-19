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

  // Exact geometric parameters matching reference image
  const H = 84;
  const topBaseline = 24;
  const bottom = 82;
  const capRadius = (bottom - topBaseline) / 2; // 29px rounded stadium ends
  const cx = width / 2;
  const domeHalf = 52; // smooth bell curve spread
  const domePeakY = 3; // rounded peak apex

  // Continuous smooth SVG path with horizontal tangents at baseline and dome peak
  const svgPath = `
    M ${capRadius}, ${topBaseline}
    L ${cx - domeHalf}, ${topBaseline}
    C ${cx - 28}, ${topBaseline} ${cx - 26}, ${domePeakY} ${cx}, ${domePeakY}
    C ${cx + 26}, ${domePeakY} ${cx + 28}, ${topBaseline} ${cx + domeHalf}, ${topBaseline}
    L ${width - capRadius}, ${topBaseline}
    A ${capRadius} ${capRadius} 0 0 1 ${width - capRadius}, ${bottom}
    L ${capRadius}, ${bottom}
    A ${capRadius} ${capRadius} 0 0 1 ${capRadius}, ${topBaseline}
    Z
  `.replace(/\s+/g, " ").trim();

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-50 mx-auto w-full max-w-[420px] px-3 pointer-events-none lg:hidden">
      <div
        ref={containerRef}
        className="pointer-events-auto relative w-full h-[84px] select-none"
      >
        {/* Custom SVG Background with Continuous Dark Navy Border & Center Dome */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible drop-shadow-[0_10px_25px_rgba(30,41,59,0.14)]"
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={svgPath}
            fill="#ffffff"
            stroke="#2b364a"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* 5 Tab Navigation Items */}
        <div className="relative z-10 grid grid-cols-5 h-full items-center px-1">
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
                    className="group -mt-5 flex flex-col items-center justify-center transition-transform active:scale-95"
                  >
                    <div
                      className={cn(
                        "flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-tr from-[#059669] to-[#10b981] text-white shadow-[0_8px_20px_rgba(16,185,129,0.4)] transition-all",
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
                        isActive ? "text-[#059669] font-semibold" : "text-[#475569]"
                      )}
                    >
                      Copilot
                    </span>
                  </Link>
                </div>
              );
            }

            // Normal Tab (Home, Records, Meds, Chronic Care)
            // Positioned inside the baseline body (topBaseline = 24 to bottom = 82)
            return (
              <div
                key={tab.name}
                className="flex flex-col items-center justify-center h-full pt-[22px] pb-[6px]"
              >
                <Link
                  href={tab.href!}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full transition-all group",
                    isActive
                      ? "text-[#059669]"
                      : "text-[#475569] hover:text-[#1e293b]"
                  )}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={cn(
                        "h-[22px] w-[22px] transition-transform",
                        isActive
                          ? "stroke-[2.2] text-[#059669] scale-105"
                          : "stroke-[1.9] text-[#475569] group-hover:scale-105"
                      )}
                    />

                    {/* Notification badge on Records */}
                    {tab.badge && (
                      <span className="absolute -top-1 -right-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#059669] px-1 text-[9px] font-extrabold text-white shadow-sm ring-1.5 ring-white">
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      "mt-1 text-[11px] leading-tight text-center tracking-tight",
                      isActive ? "font-semibold text-[#059669]" : "font-medium text-[#475569]"
                    )}
                  >
                    {tab.name}
                  </span>

                  {/* Active Indicator Bar (rounded pill like in screenshot) */}
                  {isActive ? (
                    <span className="mt-1 h-[3.5px] w-4 rounded-full bg-[#059669]" />
                  ) : (
                    <span className="mt-1 h-[3.5px] w-4 rounded-full bg-transparent" />
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
