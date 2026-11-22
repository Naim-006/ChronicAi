"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, CheckCircle2, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export function DoctorMobileTopBar() {
  const { user, profile, doctorProfile, isDoctor, signOut } = useAuth();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const doctorName =
    doctorProfile?.full_name ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    "Doctor";
  const doctorSpecialty = doctorProfile?.specialty || "Physician";
  const bmdcNo = doctorProfile?.bmdc_number || "Verified BMDC";

  const initials = doctorName
    .replace(/^Dr\.\s+/i, "")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentAvatar =
    profile?.avatar_url || (user?.user_metadata?.avatar_url as string) || null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#070d18]/90 px-4 backdrop-blur-xl lg:hidden">
      {/* Brand */}
      <Link href="/doctor/dashboard" className="flex items-center gap-2.5">
        <div className="relative flex h-8 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white border border-slate-200/80 p-0.5">
          <Image
            src="/logo.png"
            alt="ChronicAI"
            width={38}
            height={24}
            className="object-contain w-full h-full"
            priority
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
              Chronic<span className="text-emerald-500">AI</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300/60 dark:border-emerald-600/40 px-1 py-0.2 rounded">
              CLINICAL
            </span>
          </div>
        </div>
      </Link>

      {/* Quick Switch & Profile */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-lg border border-purple-200/80 dark:border-purple-500/30 bg-purple-50/80 dark:bg-purple-950/40 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 transition-colors"
          title="Switch to Patient Portal"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Patient Mode</span>
        </Link>

        {/* Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-xs overflow-hidden cursor-pointer"
            aria-label="Doctor Menu"
          >
            {currentAvatar ? (
              <img src={currentAvatar} alt={doctorName} className="h-full w-full object-cover" />
            ) : (
              initials || "DR"
            )}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c1322] p-2 shadow-xl z-50">
              <div className="p-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {doctorName}
                  </span>
                  {isDoctor && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {doctorSpecialty} · {bmdcNo}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors"
                >
                  <ArrowLeftRight className="h-4 w-4 text-purple-600" />
                  <span>Switch to Patient Portal</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
