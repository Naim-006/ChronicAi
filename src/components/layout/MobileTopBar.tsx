"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useMobileNav } from "./MobileNavContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

function ProfileDropdown() {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Patient User";
  const userEmail = user?.email || "patient@chronicai.health";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentAvatar =
    profile?.avatar_url ||
    (profile?.preferences as any)?.avatar_url ||
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/[0.08] transition-all cursor-pointer"
        title={`${displayName} (${userEmail})`}
        aria-label="User Profile Menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/20 overflow-hidden">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            initials || "A"
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 text-left">
          {/* User Details Header */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--secondary)] border border-[var(--border)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-xs font-extrabold text-white shadow-sm overflow-hidden">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || "PT"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-extrabold text-[var(--foreground)]">
                {displayName}
              </span>
              <span className="block truncate text-[11px] text-[var(--muted-foreground)]">
                {userEmail}
              </span>
            </div>
          </div>

          {/* Quick Menu Links */}
          <div className="mt-2 space-y-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Medical Profile & ID</span>
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              <Settings className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span>Settings & Preferences</span>
            </Link>
          </div>

          <div className="my-2 border-t border-[var(--border)]" />

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

const pageTitles: Record<string, { title: string; parent?: string }> = {
  "/dashboard": { title: "Home" },
  "/vault": { title: "Medical Records", parent: "/dashboard" },
  "/timeline": { title: "Timeline", parent: "/dashboard" },
  "/assistant": { title: "Clinical Copilot", parent: "/dashboard" },
  "/appointments": { title: "Appointments", parent: "/dashboard" },
  "/medications": { title: "Medications", parent: "/dashboard" },
  "/metrics": { title: "Health Analytics", parent: "/dashboard" },
  "/chronic-care": { title: "Chronic Care", parent: "/dashboard" },
  "/screenings": { title: "Health Screenings", parent: "/dashboard" },
  "/notifications": { title: "Notifications", parent: "/dashboard" },
  "/profile": { title: "Profile", parent: "/dashboard" },
  "/summaries": { title: "Summaries", parent: "/dashboard" },
  "/settings": { title: "Settings", parent: "/dashboard" },
  "/doctors": { title: "Doctors", parent: "/dashboard" },
};

export function MobileTopBar() {
  const pathname = usePathname();
  const { openDrawer } = useMobileNav();
  const { t } = useLanguage();
  const { user, profile } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Patient";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const localizedTitles: Record<string, string> = {
    "/dashboard": t("nav.home", "Home"),
    "/vault": t("nav.records", "Medical Records"),
    "/timeline": t("nav.timeline", "Timeline"),
    "/assistant": t("nav.copilot", "Clinical Copilot"),
    "/appointments": t("nav.appointments", "Appointments"),
    "/medications": t("nav.meds", "Medications"),
    "/metrics": t("nav.analytics", "Health Analytics"),
    "/chronic-care": t("nav.chronic_care", "Chronic Care"),
    "/screenings": t("nav.screenings", "Health Screenings"),
    "/notifications": t("nav.notifications", "Notifications"),
    "/profile": t("nav.profile", "Profile"),
    "/settings": t("nav.settings", "Settings"),
  };

  const pageTitle = localizedTitles[pathname] || (pageTitles[pathname]?.title ?? "ChronicAI");
  const isDashboard = pathname === "/dashboard" || pathname === "/";

  return (
    <>
      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-30 flex h-16 w-full max-w-full items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] bg-white/85 dark:bg-[#070d18]/90 px-3.5 sm:px-6 backdrop-blur-xl lg:hidden">
        {/* Left Side: Menu Button + Page Context */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={openDrawer}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 shadow-xs text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 hover:border-emerald-300 transition-all active:scale-95 cursor-pointer"
            title="Open Menu"
            aria-label="Open Menu"
          >
            {/* Modern Staggered Pill Menu Icon */}
            <svg
              className="h-4.5 w-4.5 text-slate-800 dark:text-white"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2.5" y="4" width="15" height="2" rx="1" fill="currentColor" />
              <rect x="2.5" y="9" width="10" height="2" rx="1" fill="currentColor" />
              <rect x="2.5" y="14" width="13" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {isDashboard ? "ChronicAI" : pageTitle}
            </h1>
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
              Lifelong Care Intelligence
            </span>
          </div>
        </div>

        {/* Right Side: Notification Icon + Profile Icon */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-200 dark:hover:bg-white/10"
            title="Notifications & Alerts"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          </Link>

          <ProfileDropdown />
        </div>
      </header>

      {/* Desktop top bar */}
      <header className="sticky top-0 z-30 hidden h-[76px] w-full items-center justify-between border-b border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#070d18]/85 backdrop-blur-2xl px-8 lg:flex">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {isDashboard ? (
              <>
                <span>
                  {(() => {
                    const h = new Date().getHours();
                    if (h < 12) return "Good Morning";
                    if (h < 18) return "Good Afternoon";
                    return "Good Evening";
                  })()}
                  , {displayName.split(" ")[0]}
                </span>
                <span>👋</span>
              </>
            ) : (
              pageTitle
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isDashboard
              ? "Your health, our priority."
              : "Secure lifelong health workspace"}
          </p>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="relative hidden xl:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search records, meds, visits…"
              className="h-10 w-80 rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.05] backdrop-blur-md pl-10 pr-4 text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500/50 focus:bg-white dark:focus:bg-white/[0.08] focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.05] backdrop-blur-md text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-200/70 dark:hover:bg-white/[0.1] hover:text-slate-900 dark:hover:text-white"
            title="Notifications & Alerts"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            </span>
          </Link>

          <ProfileDropdown />
        </div>
      </header>
    </>
  );
}
