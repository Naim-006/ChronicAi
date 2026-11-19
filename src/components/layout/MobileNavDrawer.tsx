"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Home,
  FileText,
  Clock,
  Stethoscope,
  Activity,
  Pill,
  Calendar,
  HeartPulse,
  Heart,
  Bell,
  User,
  Settings,
  Users,
  Printer,
  ChevronRight,
  ShieldCheck,
  Search,
  AlertCircle,
  ExternalLink,
  Phone,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const navGroups = [
  {
    title: "Main",
    items: [
      {
        name: "Home",
        href: "/dashboard",
        icon: Home,
      },
      {
        name: "Copilot",
        href: "/assistant",
        icon: Stethoscope,
        highlight: true,
      },
    ],
  },
  {
    title: "Records",
    items: [
      {
        name: "Medical Records",
        href: "/vault",
        icon: FileText,
      },
      {
        name: "Timeline",
        href: "/timeline",
        icon: Clock,
      },
    ],
  },
  {
    title: "Health",
    items: [
      {
        name: "Evaluation",
        href: "/evaluation",
        icon: HeartPulse,
      },
      {
        name: "Analytics",
        href: "/metrics",
        icon: Activity,
      },
      {
        name: "Medications",
        href: "/medications",
        icon: Pill,
      },
      {
        name: "Appointments",
        href: "/appointments",
        icon: Calendar,
      },
      {
        name: "Chronic",
        href: "/chronic-care",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        name: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
      {
        name: "Profile",
        href: "/profile",
        icon: User,
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-200">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Left Sidebar Drawer */}
      <div className="relative z-10 h-full w-[300px] flex flex-col bg-white/95 backdrop-blur-xl border-r-2 border-slate-300 shadow-[0_0_60px_rgba(0,0,0,0.15)] overflow-hidden animate-in slide-in-from-left duration-300">
        {/* Header with gradient */}
        <div className="relative h-[80px] flex items-center px-5 border-b border-slate-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-white to-sky-50 opacity-60" />
          <div className="relative flex items-center gap-3 w-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <span className="block text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                ChronicAI
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                Lifelong Care
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.title}>
              <span className="mb-3 block px-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                {group.title}
              </span>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  if (item.highlight) {
                    return (
                      <Link
                        key={item.name}
                        href={item.href!}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/30">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="relative text-emerald-700">{item.name}</span>
                        <ChevronRight className="ml-auto h-4 w-4 text-emerald-400" />
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href!}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all group relative",
                        isActive
                          ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-900 shadow-sm border border-emerald-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                        isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-600"
                      )}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="flex-1">{item.name}</span>
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Profile */}
        <div className="border-t-2 border-slate-200 p-4 bg-gradient-to-r from-slate-50 to-white">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl p-3 transition-all hover:bg-white hover:shadow-md border border-slate-200/50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-100">
              EV
            </div>
            <div className="flex-1">
              <span className="block text-sm font-bold text-slate-900 leading-tight">
                Elena Vance
              </span>
              <span className="block text-[11px] text-slate-500 font-medium">
                View Profile
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
