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
    <div className="flex min-h-screen w-full bg-[#F4F6F8] text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Desktop Left Rail Navigation */}
      <DesktopNavRail />

      {/* Main Mobile-First Application Column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <MobileTopBar />

        {/* Content Container (Center-aligned, optimized for mobile/tablet reading) */}
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-4 sm:py-6 pb-24 lg:pb-12">
          {children}
        </main>

        {/* Mobile Native Bottom Tab Bar */}
        <MobileTabBar />
      </div>
    </div>
  );
}
