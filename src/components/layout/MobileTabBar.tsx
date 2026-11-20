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
  const navRef = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(420);
  const [isVisible, setIsVisible] = useState(true);

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

  // Scroll & touch awareness: smoothly auto-hide dock on scroll down, reveal on scroll up
  useEffect(() => {
    setIsVisible(true);

    let lastScrollY =
      typeof window !== "undefined"
        ? window.pageYOffset || document.documentElement.scrollTop || 0
        : 0;
    let touchStartY = 0;
    let touchStartX = 0;
    let lastTouchY = 0;
    let isTouching = false;
    let ticking = false;

    // 1. Direct Touch Gesture Tracking for mobile devices
    const handleGlobalTouchStart = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      if (navRef.current && navRef.current.contains(e.target as Node)) {
        return; // ignore touches inside the dock itself
      }
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      isTouching = true;
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isTouching || !e.touches || e.touches.length === 0) return;
      if (navRef.current && navRef.current.contains(e.target as Node)) {
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaYFromStart = touchStartY - currentY; // positive = scrolling down
      const deltaXFromStart = currentX - touchStartX;
      const stepDeltaY = lastTouchY - currentY;
      lastTouchY = currentY;

      // Ensure gesture is predominantly vertical
      if (Math.abs(deltaYFromStart) > Math.abs(deltaXFromStart) * 0.75) {
        if (stepDeltaY > 8 && deltaYFromStart > 18) {
          // Swiped up -> scrolling down -> hide dock smoothly
          setIsVisible(false);
        } else if (stepDeltaY < -8 && deltaYFromStart < -18) {
          // Swiped down -> scrolling up -> reveal dock smoothly
          setIsVisible(true);
        }
      }
    };

    const handleGlobalTouchEnd = () => {
      isTouching = false;
    };

    // 2. Window Scroll Event Tracking
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY =
            window.pageYOffset ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            0;
          const diff = currentY - lastScrollY;

          if (currentY <= 25) {
            setIsVisible(true);
          } else if (Math.abs(diff) > 12) {
            if (diff > 0) {
              // Scrolling down -> disappear
              setIsVisible(false);
            } else {
              // Scrolling up -> appear
              setIsVisible(true);
            }
            lastScrollY = currentY;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    // 3. Wheel event tracking (for mouse & trackpad)
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 10) {
        if (e.deltaY > 0) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
    };

    window.addEventListener("touchstart", handleGlobalTouchStart, { passive: true });
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: true });
    window.addEventListener("touchend", handleGlobalTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleGlobalTouchEnd, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleGlobalTouchStart);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
      window.removeEventListener("touchcancel", handleGlobalTouchEnd);
      window.removeEventListener("scroll", handleScroll, { capture: true } as any);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [pathname]);

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

  // Exact geometric parameters:
  // - Top baseline with soft rounded top corners, flat bottom resting flush at screen bottom
  // - Smooth curved hump over center Copilot button (spread = 72px, apex at domePeakY = 6)
  const H = 90;
  const topBaseline = 26;
  const bottom = 90;
  const cornerRadius = 22;
  const cx = width / 2;
  const spread = 72; // width where curve begins curving up
  const cpSpread = 44; // baseline control point
  const cpPeak = 24; // apex control point
  const domePeakY = 6; // apex of dome

  // Continuous SVG path: flat bottom flush to screen bottom, curved dome over Copilot
  const svgPath = `
    M 0, ${topBaseline + cornerRadius}
    Q 0, ${topBaseline} ${cornerRadius}, ${topBaseline}
    L ${cx - spread}, ${topBaseline}
    C ${cx - cpSpread}, ${topBaseline} ${cx - cpPeak}, ${domePeakY} ${cx}, ${domePeakY}
    C ${cx + cpPeak}, ${domePeakY} ${cx + cpSpread}, ${topBaseline} ${cx + spread}, ${topBaseline}
    L ${width - cornerRadius}, ${topBaseline}
    Q ${width}, ${topBaseline} ${width}, ${topBaseline + cornerRadius}
    L ${width}, ${bottom}
    L 0, ${bottom}
    Z
  `.replace(/\s+/g, " ").trim();

  // Upper silhouette edge path for a distinct, crisp border separating bar from body content
  const topBorderPath = `
    M 0, ${topBaseline + cornerRadius}
    Q 0, ${topBaseline} ${cornerRadius}, ${topBaseline}
    L ${cx - spread}, ${topBaseline}
    C ${cx - cpSpread}, ${topBaseline} ${cx - cpPeak}, ${domePeakY} ${cx}, ${domePeakY}
    C ${cx + cpPeak}, ${domePeakY} ${cx + cpSpread}, ${topBaseline} ${cx + spread}, ${topBaseline}
    L ${width - cornerRadius}, ${topBaseline}
    Q ${width}, ${topBaseline} ${width}, ${topBaseline + cornerRadius}
  `.replace(/\s+/g, " ").trim();

  return (
    <nav
      ref={navRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-xl pointer-events-none lg:hidden transition-all duration-300 ease-in-out will-change-transform",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-28 opacity-0 pointer-events-none"
      )}
    >
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "pointer-events-auto relative w-full h-[90px] select-none touch-pan-y cursor-grab active:cursor-grabbing",
          waveState.active && "animate-liquid-wave"
        )}
      >
        {/* Frosted Translucent Glass Layer with 5px blur */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none backdrop-blur-[5px]",
            isDark ? "bg-[#0b1325]/45" : "bg-white/40"
          )}
          style={{
            clipPath: `path('${svgPath}')`,
            WebkitClipPath: `path('${svgPath}')`,
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
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
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible drop-shadow-[0_-6px_22px_rgba(15,23,42,0.14)]"
          width="100%"
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main translucent glass silhouette */}
          <path
            d={svgPath}
            fill={isDark ? "rgba(11, 19, 37, 0.55)" : "rgba(255, 255, 255, 0.40)"}
            stroke="none"
          />

          {/* Distinct Upper Border to visually separate bar from body content */}
          <path
            d={topBorderPath}
            fill="none"
            stroke={isDark ? "rgba(255, 255, 255, 0.28)" : "rgba(100, 116, 139, 0.45)"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Subtle teal accent rim glow on the top curve */}
          <path
            d={topBorderPath}
            fill="none"
            stroke={isDark ? "rgba(52, 211, 153, 0.25)" : "rgba(16, 185, 129, 0.35)"}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
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

            // Center Copilot Button: Elevated floating mascot avatar button matching Image 1
            if (tab.isCenterCopilot) {
              return (
                <div
                  key={tab.name}
                  className="flex flex-col items-center justify-start h-full pt-[9px]"
                >
                  <Link
                    href={tab.href!}
                    aria-label="Chronic AI Copilot"
                    className="flex flex-col items-center justify-center group active:scale-95 transition-transform outline-none focus:outline-none focus-visible:outline-none focus:ring-0 [-webkit-tap-highlight-color:transparent]"
                  >
                    {/* Floating Mascot Button */}
                    <div
                      className={cn(
                        "flex h-[48px] w-[48px] sm:h-[50px] sm:w-[50px] items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500/20 via-[#0b1728] to-teal-500/20 border-2 border-emerald-400 shadow-[0_4px_16px_rgba(16,185,129,0.38)] transition-all overflow-hidden p-0.5",
                        isActive
                          ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0b1325] scale-105"
                          : "group-hover:scale-105"
                      )}
                    >
                      <img
                        src="/images/ai-doctor.png"
                        alt="ChronicAI Copilot"
                        className="h-full w-full object-contain drop-shadow-xs"
                      />
                    </div>

                    {/* Copilot Text */}
                    <span
                      className={cn(
                        "text-[10px] sm:text-[11px] leading-none tracking-tight whitespace-nowrap mt-1",
                        isActive
                          ? "font-bold text-emerald-600 dark:text-emerald-400"
                          : "font-medium text-slate-700 dark:text-slate-400"
                      )}
                    >
                      {tab.name}
                    </span>

                    {/* Spacer to align with tab indicators */}
                    <span className="h-[3px] w-3 rounded-full bg-transparent mt-1" />
                  </Link>
                </div>
              );
            }

            // Normal Tab (Home, Records, Meds, Chronic Care)
            return (
              <div
                key={tab.name}
                className="flex flex-col items-center justify-start h-full pt-[37px]"
              >
                <Link
                  href={tab.href!}
                  className="flex flex-col items-center justify-center w-full group active:scale-95 transition-transform outline-none focus:outline-none focus-visible:outline-none focus:ring-0 [-webkit-tap-highlight-color:transparent]"
                >
                  {/* Tab Icon */}
                  <div className="h-[24px] w-[24px] sm:h-[26px] sm:w-[26px] flex items-center justify-center relative">
                    <Icon
                      className={cn(
                        "h-[21px] w-[21px] sm:h-[23px] sm:w-[23px] transition-transform",
                        isActive
                          ? "stroke-[2.2] text-emerald-600 dark:text-emerald-400 scale-105"
                          : "stroke-[1.8] text-slate-700 dark:text-slate-400 group-hover:scale-105"
                      )}
                    />
                  </div>

                  {/* Tab Label */}
                  <span
                    className={cn(
                      "text-[10px] sm:text-[11px] leading-none tracking-tight text-center truncate max-w-full px-0.5 mt-1",
                      isActive
                        ? "font-bold text-emerald-600 dark:text-emerald-400"
                        : "font-semibold text-slate-700 dark:text-slate-400"
                    )}
                  >
                    {tab.name}
                  </span>

                  {/* Active Indicator Pill */}
                  <span
                    className={cn(
                      "h-[3px] w-3 rounded-full mt-1 transition-all duration-200",
                      isActive
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-100"
                        : "bg-transparent scale-0"
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
