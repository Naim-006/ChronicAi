"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { DesktopNavRail } from "@/components/layout/DesktopNavRail";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { ToastProvider } from "@/components/shared/Toast";
import { MobileNavProvider } from "@/components/layout/MobileNavContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAssistant = pathname === "/assistant";

  return (
    <ToastProvider>
      <MobileNavProvider>
        <div className="mint-wash relative flex min-h-screen w-full max-w-full overflow-x-hidden text-[var(--foreground)] antialiased">
          {/* Ambient aurora glowing meshes */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px]" />
            <div className="absolute -right-24 top-20 h-[30rem] w-[30rem] rounded-full bg-purple-500/10 dark:bg-purple-600/12 blur-[140px]" />
            <div className="absolute left-1/3 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 dark:bg-cyan-500/12 blur-[120px]" />
          </div>

          <div className="relative z-10 flex w-full">
            <DesktopNavRail />

            <div className="flex min-w-0 flex-1 max-w-full overflow-x-hidden flex-col">
              <MobileTopBar />

              <main
                className={`mx-auto w-full max-w-6xl flex-1 px-3 sm:px-6 lg:px-8 page-transition ${
                  isAssistant
                    ? "py-2 sm:py-4 pb-24 lg:pb-8"
                    : "py-4 sm:py-6 pb-28 lg:pb-10"
                }`}
              >
                {children}
              </main>

              <MobileTabBar />
            </div>
          </div>
        </div>
      </MobileNavProvider>
    </ToastProvider>
  );
}
