"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

interface AppHeaderProps {
  onToggleMobileMenu?: () => void;
}

export function AppHeader({ onToggleMobileMenu }: AppHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Patient";
  const userEmail = user?.email || "patient@chronicai.health";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 lg:px-8 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search */}
        <div className="relative hidden md:block w-72 lg:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search documents, medications, tests, or doctors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Upload Action */}
        <Link href="/vault">
          <Button size="sm" className="hidden sm:flex items-center gap-1.5 text-xs h-8">
            <UploadCloud className="h-3.5 w-3.5" />
            Upload Record
          </Button>
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-600 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-lg z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[11px] text-teal-700 font-medium cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="rounded-full bg-amber-100 p-1 text-amber-700 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Review Pending Document</span>
                    <span className="text-slate-500 text-[11px] block">
                      Ophthalmology discharge report requires user verification.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <div className="rounded-full bg-teal-100 p-1 text-teal-700 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Upcoming Appointment</span>
                    <span className="text-slate-500 text-[11px] block">
                      Dr. Catherine Wei on Dec 8 at 10:15 AM.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Patient Profile Context Badge & Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-3 hover:bg-slate-100 transition-colors cursor-pointer text-left"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold">
              {initials || "PT"}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold text-slate-900 block leading-none">{displayName}</span>
              <span className="text-[10px] text-slate-500 block leading-none mt-0.5">Health Profile</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-3xl border border-slate-200 bg-white p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 text-left">
              {/* User Details Header */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-xs font-extrabold text-white shadow-sm">
                  {initials || "PT"}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-extrabold text-slate-900">
                    {displayName}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {userEmail}
                  </span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-2 space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-4 w-4 text-emerald-600" />
                  <span>Medical Profile & ID</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Settings & Preferences</span>
                </Link>
              </div>

              <div className="my-2 border-t border-slate-100" />

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
