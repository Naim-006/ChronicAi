"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderArchive,
  Clock,
  Stethoscope,
  Pill,
  CalendarDays,
  LineChart,
  HeartPulse,
  UserRound,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Medical Records", href: "/vault", icon: FolderArchive },
  { name: "Medical Timeline", href: "/timeline", icon: Clock },
  { name: "Clinical AI", href: "/assistant", icon: Stethoscope },
  { name: "Medications", href: "/medications", icon: Pill },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Health Analytics", href: "/metrics", icon: LineChart },
  { name: "Chronic Care", href: "/chronic-care", icon: HeartPulse },
  { name: "Health Profile", href: "/profile", icon: UserRound },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Patient";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold text-slate-900">Universal Medical AI</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-900 font-semibold border-l-2 border-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-teal-700" : "text-slate-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
          {displayName} • Logged in
        </div>
      </div>
    </div>
  );
}
