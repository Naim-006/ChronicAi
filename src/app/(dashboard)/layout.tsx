"use client";

import React from "react";
import { DesktopNavRail } from "@/components/layout/DesktopNavRail";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-[#F6F8FA] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Desktop Left Rail Navigation */}
      <DesktopNavRail />

      {/* Main Application Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <MobileTopBar />

        {/* Content Container (Adaptive responsive: max-w-5xl on desktop, full mobile width with bottom bar padding) */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-12">
          {children}
        </main>

        {/* Floating Mobile Bottom Tab Bar */}
        <MobileTabBar />
      </div>
    </div>
  );
}
