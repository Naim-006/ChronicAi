"use client";

import React from "react";
import { DesktopNavRail } from "@/components/layout/DesktopNavRail";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { ToastProvider } from "@/components/shared/Toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="mint-wash flex min-h-screen w-full text-[var(--foreground)] antialiased">
        <DesktopNavRail />

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-28 lg:pb-10 page-transition">
            {children}
          </main>

          <MobileTabBar />
        </div>
      </div>
    </ToastProvider>
  );
}
