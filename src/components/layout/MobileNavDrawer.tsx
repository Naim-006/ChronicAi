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
    title: "Clinical Care",
    items: [
      {
        name: "Home Overview",
        href: "/dashboard",
        icon: Home,
        description: "Vitals, daily protocols & recovery progress",
      },
      {
        name: "Medical Records Vault",
        href: "/vault",
        icon: FileText,
        badge: "1 Review",
        description: "Encrypted PDFs, lab panels & OCR verification",
      },
      {
        name: "Longitudinal Timeline",
        href: "/timeline",
        icon: Clock,
        description: "CareSight branched trajectory & care events",
      },
      {
        name: "Clinical Copilot",
        href: "/assistant",
        icon: Stethoscope,
        highlight: true,
        description: "Grounded AI medical assistant & visit prep",
      },
      {
        name: "Doctor Handout Summaries",
        href: "/summaries",
        icon: Printer,
        description: "1-page clinical printout & 24hr doctor portal",
      },
    ],
  },
  {
    title: "Health & Monitoring",
    items: [
      {
        name: "Health Evaluation & Risk",
        href: "/evaluation",
        icon: HeartPulse,
        badge: "88% Optimal",
        description: "ASCVD 10-year risk & KDIGO CKD staging",
      },
      {
        name: "Health Analytics & Vitals",
        href: "/metrics",
        icon: Activity,
        description: "Blood glucose, blood pressure & trend charts",
      },
      {
        name: "Medications & Safety",
        href: "/medications",
        icon: Pill,
        description: "Adherence matrix & drug-drug interaction checker",
      },
      {
        name: "Appointments & Visits",
        href: "/appointments",
        icon: Calendar,
        description: "Upcoming consultations & doctor discussion prep",
      },
      {
        name: "Chronic Care Module",
        href: "/chronic-care",
        icon: Heart,
        description: "Type 2 Diabetes & hypertension specialized plans",
      },
      {
        name: "Care Team & Doctors",
        href: "/doctors",
        icon: Users,
        description: "Assigned specialists, endocrinologist & clinics",
      },
    ],
  },
  {
    title: "Alerts & Security",
    items: [
      {
        name: "Notifications & Alerts",
        href: "/notifications",
        icon: Bell,
        badge: "3 Alerts",
        description: "Critical biometric flags & refill countdowns",
      },
      {
        name: "Emergency Medical ID",
        href: "/profile",
        icon: User,
        description: "Allergies, blood type & emergency contact",
      },
      {
        name: "Account & Preferences",
        href: "/settings",
        icon: Settings,
        description: "Data encryption, PIN security & language",
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
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden animate-in fade-in duration-200">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-Up Sheet Container */}
      <div className="relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-[32px] bg-white border-t border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Grab Handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-600/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-extrabold text-slate-900 leading-tight">
                ChronicAI Care Hub
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                All 14 Clinical Pages Available
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 pt-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search any page, record, or tool..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Patient Identity Quick Card */}
        <div className="px-5 py-2">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/80 hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 font-extrabold text-white text-xs shadow-sm">
                EV
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900 truncate">
                    Elena Vance
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                    O+
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 truncate block">
                  T2D · HTN · Penicillin Allergy
                </span>
              </div>
            </div>

            <span className="shrink-0 text-xs font-bold text-emerald-700 flex items-center gap-0.5">
              Medical ID
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        {/* Scrollable Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-5">
          {filteredGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                {group.title}
              </span>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl transition-all group",
                        isActive
                          ? "bg-emerald-50 text-emerald-950 font-bold border border-emerald-200/90 shadow-2xs"
                          : "hover:bg-slate-50 border border-transparent text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                            isActive
                              ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm"
                              : item.highlight
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <span
                            className={cn(
                              "block text-xs font-extrabold leading-tight truncate",
                              isActive ? "text-emerald-950" : "text-slate-900"
                            )}
                          >
                            {item.name}
                          </span>
                          <span className="block text-[10px] text-slate-500 leading-tight truncate mt-0.5">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.badge && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 border border-emerald-200">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer with Emergency Shortcut */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <a
            href="tel:+15552345678"
            className="flex items-center gap-2 text-xs font-bold text-rose-700 hover:text-rose-900"
          >
            <Phone className="h-3.5 w-3.5 text-rose-600" />
            <span>Emergency: Robert Vance</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close Menu
          </button>
        </div>
      </div>
    </div>
  );
}
