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

  // Scroll-aware Auto-Hide: Hide smoothly on scroll down, reveal on scroll up
  const [isVisible, setIsVisible] = useState(true);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Always start visible when navigating to a new page
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
    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      // If touching inside the bottom bar itself, ignore so tabs can be tapped or swiped
      if (navRef.current && navRef.current.contains(e.target as Node)) {
        return;
      }
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      isTouching = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching || !e.touches || e.touches.length === 0) return;
      if (navRef.current && navRef.current.contains(e.target as Node)) {
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaYFromStart = touchStartY - currentY; // positive = swiped up (scrolling down)
      const deltaXFromStart = currentX - touchStartX;
      const stepDeltaY = lastTouchY - currentY;
      lastTouchY = currentY;

      // Ensure it is predominantly a vertical scroll gesture
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

    const handleTouchEnd = () => {
      isTouching = false;
    };

    // 2. Scroll Event Tracking (captures window & scrollable sub-containers)
    const handleScroll = (e: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY =
            window.pageYOffset ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            0;
          const diff = currentY - lastScrollY;

          if (currentY <= 25) {
            // Near top of document -> show dock
            setIsVisible(true);
          } else if (Math.abs(diff) > 12) {
            if (diff > 0) {
              // Scrolling down
              setIsVisible(false);
            } else {
              // Scrolling up
              setIsVisible(true);
            }
            lastScrollY = currentY;
          }

          // If an internal scroll container (e.g., chat stream) is scrolling
          const target = e.target as HTMLElement;
          if (
            target &&
            target !== (document as any) &&
            target !== (window as any) &&
            typeof target.scrollTop === "number"
          ) {
            if (target.scrollTop <= 20) {
              setIsVisible(true);
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    // 3. Wheel Event Tracking (for desktop/devtools mobile emulation)
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 10) {
        if (e.deltaY > 0) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("scroll", handleScroll, { capture: true } as any);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [pathname]);

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

  // Balanced, sleek floating capsule dock without awkward protruding dome
  const H = 68;
  const topBaseline = 6;
  const bottom = 64;
  const capRadius = 29; // (64 - 6) / 2
  const cx = width / 2;
  const spread = 48;
  const cpSpread = 26;
  const cpPeak = 14;
  const domePeakY = 3; // subtle 3px gentle curve, sits level with other tabs

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
    <nav
      ref={navRef}
      className={cn(
        "fixed bottom-3 sm:bottom-4 md:bottom-5 left-0 right-0 z-50 mx-auto w-[94%] sm:w-[88%] md:w-[78%] max-w-xl pointer-events-none lg:hidden transition-all duration-300 ease-in-out will-change-transform",
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
          "pointer-events-auto relative w-full h-[68px] select-none touch-pan-y cursor-grab active:cursor-grabbing",
          waveState.active && "animate-liquid-wave"
        )}
      >
        {/* Frosted Translucent Glass Layer with soft blur */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none backdrop-blur-xl",
            isDark ? "bg-[#0b1325]/92 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]" : "bg-white/95"
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
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible drop-shadow-[0_10px_28px_rgba(0,0,0,0.3)]"
          width="100%"
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={svgPath}
            fill={isDark ? "rgba(9, 16, 30, 0.88)" : "rgba(255, 255, 255, 0.95)"}
            stroke={isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(203, 213, 225, 0.8)"}
            strokeWidth="1.2"
            strokeOpacity="1"
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

            // Center Copilot Button: Harmonious, gently elevated button
            if (tab.isCenterCopilot) {
              return (
                <div
                  key={tab.name}
                  className="flex flex-col items-center justify-start h-full pt-[7px]"
                >
                  <Link
                    href={tab.href!}
                    aria-label="Chronic AI Copilot"
                    className="flex flex-col items-center justify-center group active:scale-95 transition-transform outline-none focus:outline-none focus-visible:outline-none focus:ring-0 [-webkit-tap-highlight-color:transparent]"
                  >
                    {/* Floating Mascot Button */}
                    <div
                      className={cn(
                        "flex h-[40px] w-[40px] sm:h-[42px] sm:w-[42px] items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500/20 via-[#0b1728] to-teal-500/20 border-2 border-emerald-400 shadow-[0_4px_14px_rgba(16,185,129,0.35)] transition-all overflow-hidden p-0.5",
                        isActive
                          ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-[#0b1325] scale-105"
                          : "group-hover:scale-105"
                      )}
                    >
                      <img
                        src="/images/ai-doctor.png"
                        alt="Copilot"
                        className="h-full w-full object-contain"
                      />
                    </div>

                    {/* Copilot Text */}
                    <span
                      className={cn(
                        "text-[9px] sm:text-[10px] leading-none tracking-tight whitespace-nowrap mt-1",
                        isActive ? "font-bold text-emerald-400" : "font-medium text-slate-400 dark:text-slate-400"
                      )}
                    >
                      {tab.name}
                    </span>

                    {/* Spacer to align with tab indicators */}
                    <span className="h-[2px] w-3 rounded-full bg-transparent mt-0.5" />
                  </Link>
                </div>
              );
            }

            // Normal Tab (Home, Records, Meds, Chronic Care)
            return (
              <div
                key={tab.name}
                className="flex flex-col items-center justify-start h-full pt-[11px]"
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
                          ? "stroke-[2.2] text-emerald-400 scale-105"
                          : "stroke-[1.8] text-slate-400 dark:text-slate-400 group-hover:scale-105"
                      )}
                    />
                  </div>

                  {/* Tab Label */}
                  <span
                    className={cn(
                      "text-[10px] sm:text-[11px] leading-none tracking-tight text-center truncate max-w-full px-0.5 mt-1",
                      isActive ? "font-bold text-emerald-400" : "font-medium text-slate-400 dark:text-slate-400"
                    )}
                  >
                    {tab.name}
                  </span>

                  {/* Active Indicator Pill */}
                  <span
                    className={cn(
                      "h-[3px] w-3 rounded-full mt-1 transition-all duration-200",
                      isActive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] scale-100" : "bg-transparent scale-0"
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
