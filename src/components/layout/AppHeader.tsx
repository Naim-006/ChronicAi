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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  onToggleMobileMenu?: () => void;
}

export function AppHeader({ onToggleMobileMenu }: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

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

        {/* Patient Profile Context Badge */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-3 hover:bg-slate-100 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold">
            EV
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-slate-900 block leading-none">Elena Vance</span>
            <span className="text-[10px] text-slate-500 block leading-none mt-0.5">T2D • HTN • CKD2</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
