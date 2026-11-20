"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  UploadCloud,
  User,
  ShieldCheck,
  CheckCircle2,
  Menu,
  X,
  Settings,
  LogOut,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { ClinicalNotification } from "@/types/medical";
import { getClinicalNotifications, markNotificationRead } from "@/lib/supabase/services/notifications";
import { useRealtimeTable } from "@/hooks/useRealtime";

interface AppHeaderProps {
  onToggleMobileMenu?: () => void;
}

export function AppHeader({ onToggleMobileMenu }: AppHeaderProps) {
  const { user, profile, effectiveUserId, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<ClinicalNotification[]>([]);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const loadNotifications = React.useCallback(async () => {
    if (!effectiveUserId) {
      setNotifications([]);
      return;
    }
    try {
      const data = await getClinicalNotifications(effectiveUserId);
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useRealtimeTable({
    table: "clinical_notifications",
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadNotifications();
    },
  });

  const unreadNotifications = notifications.filter((n) => !n.is_read);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    for (const notif of unreadNotifications) {
      await markNotificationRead(notif.id);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Patient";
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
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 lg:px-8 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden rounded-md p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search */}
        <div className="relative hidden md:block w-72 lg:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search records, medications, biomarkers, or conditions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Upload Action */}
        <Link href="/vault">
          <Button size="sm" className="hidden sm:flex items-center gap-1.5 text-xs h-8 cursor-pointer">
            <UploadCloud className="h-3.5 w-3.5" />
            Scan / Upload Record
          </Button>
        </Link>

        {/* Notification Bell */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Clinical Alerts</span>
                  {unreadNotifications.length > 0 && (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                      {unreadNotifications.length}
                    </span>
                  )}
                </div>
                {unreadNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    All caught up! No clinical notifications.
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-2.5 p-2 rounded-xl text-xs transition-colors ${
                        notif.is_read
                          ? "opacity-75"
                          : "bg-slate-50 dark:bg-slate-800/60"
                      }`}
                    >
                      <div
                        className={`rounded-full p-1 shrink-0 mt-0.5 ${
                          notif.severity === "critical"
                            ? "bg-rose-100 text-rose-700"
                            : notif.severity === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {notif.severity === "critical" ? (
                          <AlertCircle className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {notif.title}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block line-clamp-2">
                          {notif.message}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  View all alerts &amp; history
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Patient Profile Context Badge & Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1 pl-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-left"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white text-xs font-bold overflow-hidden">
              {currentAvatar ? (
                <img src={currentAvatar} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                initials || "PT"
              )}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-white block leading-none truncate max-w-[120px]">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-none mt-0.5">
                Health Profile
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 text-left">
              {/* User Details Header */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-xs font-extrabold text-white shadow-sm overflow-hidden">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    initials || "PT"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                    {displayName}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {userEmail}
                  </span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-2 space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="h-4 w-4 text-emerald-600" />
                  <span>Medical Profile &amp; Vitals</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Settings &amp; AI Config</span>
                </Link>
              </div>

              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
