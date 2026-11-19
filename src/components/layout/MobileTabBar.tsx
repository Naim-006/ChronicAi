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
  const [width, setWidth] = useState(400);

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

  // Exact geometric parameters derived from reference design
  const H = 88;
  const topBaseline = 22;
  const bottom = 86;
  const capRadius = (bottom - topBaseline) / 2; // 32px smooth stadium ends
  const cx = width / 2;
  const domeHalf = 48; // balanced dome spread around 50px circle
  const domePeakY = 4; // rounded dome apex

  // Continuous C1-smooth curve with horizontal tangents at baseline and apex
  const svgPath = `
    M ${capRadius}, ${topBaseline}
    L ${cx - domeHalf}, ${topBaseline}
    C ${cx - 28}, ${topBaseline} ${cx - 24}, ${domePeakY} ${cx}, ${domePeakY}
    C ${cx + 24}, ${domePeakY} ${cx + 28}, ${topBaseline} ${cx + domeHalf}, ${topBaseline}
    L ${width - capRadius}, ${topBaseline}
    A ${capRadius} ${capRadius} 0 0 1 ${width - capRadius}, ${bottom}
    L ${capRadius}, ${bottom}
    A ${capRadius} ${capRadius} 0 0 1 ${capRadius}, ${topBaseline}
    Z
  `.replace(/\s+/g, " ").trim();

  return (
    <nav className="fixed bottom-3 sm:bottom-4 md:bottom-5 left-0 right-0 z-50 mx-auto w-[94%] sm:w-[88%] md:w-[84%] max-w-3xl pointer-events-none lg:hidden transition-all duration-200">
      <div
        ref={containerRef}
        className="pointer-events-auto relative w-full h-[88px] select-none"
      >
        {/* Frosted Glass Backdrop Blur Layer (clipped exactly to the stadium + dome outline) */}
        <div
          className="absolute inset-0 pointer-events-none backdrop-blur-md bg-white/50"
          style={{
            clipPath: `path('${svgPath}')`,
            WebkitClipPath: `path('${svgPath}')`,
          }}
        />

        {/* Custom SVG Outline with Refined Border Boldness & Center Dome */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible drop-shadow-[0_10px_28px_rgba(30,41,59,0.12)]"
          width="100%"
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={svgPath}
            fill="rgba(255, 255, 255, 0.45)"
            stroke="#334155"
            strokeWidth="1.2"
            strokeOpacity="0.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* 5 Tab Navigation Items mathematically aligned on the same baseline */}
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
                  className="flex flex-col items-center justify-end h-full pb-[7px]"
                >
                  <Link
                    href={tab.href!}
                    aria-label="Chronic AI Copilot"
                    className="flex flex-col items-center justify-center group active:scale-95 transition-transform"
                  >
                    <div
                      className={cn(
                        "flex h-[50px] w-[50px] items-center justify-center rounded-full bg-gradient-to-tr from-[#059669] via-[#059669] to-[#10b981] text-white shadow-[0_8px_20px_rgba(16,185,129,0.38)] transition-all mb-[2px]",
                        isActive
                          ? "ring-2 ring-emerald-400 ring-offset-2 scale-105"
                          : "group-hover:scale-105"
                      )}
                    >
                      <Icon className="h-6 w-6 stroke-[2.2] text-white" />
                    </div>
                    <span
                      className={cn(
                        "text-[11px] sm:text-[12px] leading-tight tracking-tight whitespace-nowrap mb-[2px]",
                        isActive ? "font-semibold text-[#059669]" : "font-medium text-[#475569]"
                      )}
                    >
                      Copilot
                    </span>
                    <span className="h-[3px] w-3.5 rounded-full bg-transparent" />
                  </Link>
                </div>
              );
            }

            // Normal Tab (Home, Records, Meds, Chronic Care)
            return (
              <div
                key={tab.name}
                className="flex flex-col items-center justify-end h-full pb-[7px]"
              >
                <Link
                  href={tab.href!}
                  className="flex flex-col items-center justify-center w-full group active:scale-95 transition-transform"
                >
                  <div className="h-[22px] w-[22px] sm:h-[24px] sm:w-[24px] flex items-center justify-center relative mb-[5px]">
                    <Icon
                      className={cn(
                        "h-[22px] w-[22px] sm:h-[24px] sm:w-[24px] transition-transform",
                        isActive
                          ? "stroke-[2.2] text-[#059669] scale-105"
                          : "stroke-[1.8] text-[#475569] group-hover:scale-105"
                      )}
                    />

                    {/* Notification badge on Records */}
                    {tab.badge && (
                      <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#059669] px-0.5 text-[9px] font-bold text-white shadow-sm ring-1.5 ring-white">
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-[11px] sm:text-[12px] leading-tight tracking-tight text-center whitespace-nowrap mb-[2px]",
                      isActive ? "font-semibold text-[#059669]" : "font-medium text-[#475569]"
                    )}
                  >
                    {tab.name}
                  </span>

                  {/* Active Indicator Bar */}
                  <span
                    className={cn(
                      "h-[3px] w-3.5 rounded-full transition-colors",
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
