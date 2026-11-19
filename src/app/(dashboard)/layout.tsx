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
        <div className="mint-wash flex min-h-screen w-full max-w-full overflow-x-hidden text-[var(--foreground)] antialiased">
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
      </MobileNavProvider>
    </ToastProvider>
  );
}
