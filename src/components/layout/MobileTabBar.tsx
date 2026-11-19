"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Folder,
  Stethoscope,
  Pill,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

export function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(420);

  // Swipe gesture & wavy transition state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [waveState, setWaveState] = useState<{
    active: boolean;
    direction: "left" | "right";
    key: number;
  }>({
    active: false,
    direction: "left",
    key: 0,
  });

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
      name: t("nav.home", "Home"),
      href: "/dashboard",
      icon: Home,
      matchExact: true,
    },
    {
      name: t("nav.short_records", "Records"),
      href: "/vault",
      icon: Folder,
      badge: "1",
      aliases: ["/timeline", "/summaries"],
    },
    {
      name: t("nav.short_copilot", "Copilot"),
      href: "/assistant",
      icon: Stethoscope,
      isCenterCopilot: true,
    },
    {
      name: t("nav.short_meds", "Meds"),
      href: "/medications",
      icon: Pill,
    },
    {
      name: t("nav.short_chronic", "Chronic Care"),
      href: "/chronic-care",
      icon: ShieldCheck,
      aliases: ["/evaluation"],
    },
  ];

  // Current active index for swipe navigation
  const currentIndex = tabs.findIndex(
    (tab) =>
      (tab.matchExact && pathname === tab.href) ||
      (!tab.matchExact &&
        !tab.isCenterCopilot &&
        (pathname === tab.href ||
          (tab.aliases && tab.aliases.some((alias) => pathname.startsWith(alias))))) ||
      (tab.isCenterCopilot && pathname.startsWith(tab.href!))
  );

  // Touch handlers for horizontal swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      const clamped = Math.max(-40, Math.min(40, deltaX * 0.4));
      setDragOffset(clamped);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    setDragOffset(0);

    const SWIPE_THRESHOLD = 36;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      const activeIdx = currentIndex >= 0 ? currentIndex : 0;
      let targetIndex = activeIdx;

      if (deltaX < -SWIPE_THRESHOLD) {
        targetIndex = Math.min(tabs.length - 1, activeIdx + 1);
      } else if (deltaX > SWIPE_THRESHOLD) {
        targetIndex = Math.max(0, activeIdx - 1);
      }

      if (targetIndex !== activeIdx) {
        setWaveState({
          active: true,
          direction: deltaX < 0 ? "left" : "right",
          key: Date.now(),
        });

        if (typeof window !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate(12);
          } catch {}
        }

        router.push(tabs[targetIndex].href);

        setTimeout(() => {
          setWaveState((prev) => ({ ...prev, active: false }));
        }, 600);
      }
    }
  };

  // Exact geometric parameters derived from reference design:
  // - Stadium pill shape with curved ends (height 62px from y=28 to y=90)
  // - Smooth curved hump over center Copilot button (spread = 72px, apex at y=6)
  const H = 94;
  const topBaseline = 28;
  const bottom = 90;
  const capRadius = 31; // (90 - 28) / 2
  const cx = width / 2;
  const spread = 72; // width where curve begins curving up
  const cpSpread = 44; // baseline control point
  const cpPeak = 24; // apex control point
  const domePeakY = 6; // apex of dome

  // Continuous C1-smooth SVG path with horizontal tangents at baseline and apex
  const svgPath = `
    M ${capRadius}, ${topBaseline}
    L ${cx - spread}, ${topBaseline}
    C ${cx - cpSpread}, ${topBaseline} ${cx - cpPeak}, ${domePeakY} ${cx}, ${domePeakY}
    C ${cx + cpPeak}, ${domePeakY} ${cx + cpSpread}, ${topBaseline} ${cx + spread}, ${topBaseline}
    L ${width - capRadius}, ${topBaseline}
    A ${capRadius} ${capRadius} 0 0 1 ${width - capRadius}, ${bottom}
    L ${capRadius}, ${bottom}
    A ${capRadius} ${capRadius} 0 0 1 ${capRadius}, ${topBaseline}
    Z
  `.replace(/\s+/g, " ").trim();

  return (
    <nav className="fixed bottom-3 sm:bottom-4 md:bottom-5 left-0 right-0 z-50 mx-auto w-[94%] sm:w-[88%] md:w-[78%] max-w-xl pointer-events-none lg:hidden transition-all duration-200">
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "pointer-events-auto relative w-full h-[94px] select-none touch-pan-y cursor-grab active:cursor-grabbing",
          waveState.active && "animate-liquid-wave"
        )}
      >
        {/* Frosted Translucent Glass Layer with soft blur */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none backdrop-blur-[6px]",
            isDark ? "bg-[#111827]/96" : "bg-white/95"
          )}
          style={{
            clipPath: `path('${svgPath}')`,
            WebkitClipPath: `path('${svgPath}')`,
          }}
        />

        {/* Dynamic Glassy Wavy Shimmer on Swipe */}
        {waveState.active && (
          <div
            key={waveState.key}
            className={cn(
              "absolute inset-0 pointer-events-none z-20",
              waveState.direction === "left"
                ? "animate-glass-wave-left"
                : "animate-glass-wave-right"
            )}
            style={{
              clipPath: `path('${svgPath}')`,
              WebkitClipPath: `path('${svgPath}')`,
              background: `linear-gradient(${
                waveState.direction === "left" ? "90deg" : "270deg"
              }, 
                transparent 0%, 
                rgba(255, 255, 255, 0.05) 15%, 
                rgba(0, 184, 107, 0.35) 45%, 
                rgba(255, 255, 255, 0.9) 50%, 
                rgba(0, 184, 107, 0.35) 55%, 
                rgba(255, 255, 255, 0.05) 85%, 
                transparent 100%)`,
            }}
          />
        )}

        {/* Crisp Border and Smooth Dome Silhouette */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible drop-shadow-[0_10px_28px_rgba(0,0,0,0.12)]"
          width="100%"
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={svgPath}
            fill={isDark ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.95)"}
            stroke={isDark ? "#334155" : "#475569"}
            strokeWidth="1.25"
            strokeOpacity={isDark ? "0.9" : "0.75"}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* 5 Tab Items */}
        <div
          className="relative z-10 grid grid-cols-5 h-full w-full transition-transform duration-150 ease-out"
          style={{
            transform: dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
          }}
        >
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

            // Center Copilot Button: Elevated floating green circle in dome
            if (tab.isCenterCopilot) {
              return (
                <div
                  key={tab.name}
                  className="flex flex-col items-center justify-start h-full pt-[11px]"
                >
                  <Link
                    href={tab.href!}
                    aria-label="Chronic AI Copilot"
                    className="flex flex-col items-center justify-center group active:scale-95 transition-transform"
                  >
                    {/* Floating Green Circle */}
                    <div
                      className={cn(
                        "flex h-[54px] w-[54px] items-center justify-center rounded-full bg-gradient-to-b from-[#00d07e] to-[#00b86b] text-white shadow-[0_8px_20px_rgba(0,184,107,0.38)] transition-all",
                        isActive
                          ? "ring-2 ring-[#00b86b] ring-offset-2 scale-105"
                          : "group-hover:scale-105"
                      )}
                    >
                      <Icon className="h-6 w-6 stroke-[2.3] text-white" />
                    </div>

                    {/* Copilot Text */}
                    <span
                      className={cn(
                        "text-[12px] leading-tight tracking-tight whitespace-nowrap mt-[5px]",
                        isActive ? "font-semibold text-[#00b86b]" : "font-medium text-[#475569] dark:text-slate-300"
                      )}
                    >
                      {tab.name}
                    </span>

                    {/* Spacer to align with tab indicators */}
                    <span className="h-[3.5px] w-4 rounded-full bg-transparent mt-[3px]" />
                  </Link>
                </div>
              );
            }

            // Normal Tab (Home, Records, Meds, Chronic Care)
            return (
              <div
                key={tab.name}
                className="flex flex-col items-center justify-start h-full pt-[39px]"
              >
                <Link
                  href={tab.href!}
                  className="flex flex-col items-center justify-center w-full group active:scale-95 transition-transform"
                >
                  {/* Tab Icon */}
                  <div className="h-[26px] w-[26px] flex items-center justify-center relative">
                    <Icon
                      className={cn(
                        "h-[24px] w-[24px] transition-transform",
                        isActive
                          ? "stroke-[2.2] text-[#00b86b] scale-105"
                          : "stroke-[1.8] text-[#475569] dark:text-slate-300 group-hover:scale-105"
                      )}
                    />

                    {/* Notification badge on Records */}
                    {tab.badge && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#00b86b] px-1 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  {/* Tab Label */}
                  <span
                    className={cn(
                      "text-[12px] leading-tight tracking-tight text-center whitespace-nowrap mt-[5px]",
                      isActive ? "font-semibold text-[#00b86b]" : "font-medium text-[#475569] dark:text-slate-300"
                    )}
                  >
                    {tab.name}
                  </span>

                  {/* Active Indicator Pill */}
                  <span
                    className={cn(
                      "h-[3.5px] w-4 rounded-full mt-[3px] transition-colors",
                      isActive ? "bg-[#00b86b]" : "bg-transparent"
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
