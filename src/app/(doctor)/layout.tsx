"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DoctorNavRail } from "@/components/layout/DoctorNavRail";
import { DoctorMobileTopBar } from "@/components/layout/DoctorMobileTopBar";
import { DoctorMobileTabBar } from "@/components/layout/DoctorMobileTabBar";
import { ToastProvider } from "@/components/shared/Toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isDoctor, isPendingDoctor } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicDoctorRoute =
    pathname === "/doctor/register" || pathname === "/doctor/pending";

  useEffect(() => {
    if (isLoading) return;

    // 1. Not logged in -> redirect to login with return path
    if (!user) {
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Allow registration & pending verification pages
    if (isPublicDoctorRoute) {
      if (isDoctor && pathname === "/doctor/register") {
        router.push("/doctor/dashboard");
      }
      return;
    }

    // 3. Logged in but not verified doctor
    if (!isDoctor) {
      if (isPendingDoctor) {
        router.push("/doctor/pending");
      } else {
        router.push("/doctor/register");
      }
    }
  }, [user, isLoading, isDoctor, isPendingDoctor, pathname, isPublicDoctorRoute, router]);

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#070d18]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-500 font-extrabold text-sm">CA</span>
          </div>
          <div className="space-y-2 text-center">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Registration and Pending pages use lightweight clean shell without doctor nav
  if (isPublicDoctorRoute) {
    return (
      <ToastProvider>
        <div className="mint-wash relative flex min-h-screen w-full max-w-full overflow-x-hidden text-[var(--foreground)] antialiased">
          {/* Ambient aurora glowing meshes */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px]" />
            <div className="absolute -right-24 top-20 h-[30rem] w-[30rem] rounded-full bg-teal-500/10 dark:bg-teal-600/12 blur-[140px]" />
          </div>
          <div className="relative z-10 flex w-full justify-center p-4 sm:p-8">
            <main className="w-full max-w-3xl flex-1">{children}</main>
          </div>
        </div>
      </ToastProvider>
    );
  }

  // If not doctor and not on register/pending, guard will redirect; render skeleton while redirecting
  if (!isDoctor) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#070d18]">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="mint-wash relative flex min-h-screen w-full max-w-full overflow-x-hidden text-[var(--foreground)] antialiased">
        {/* Ambient aurora glowing meshes */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 print:hidden">
          <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px]" />
          <div className="absolute -right-24 top-20 h-[30rem] w-[30rem] rounded-full bg-teal-500/10 dark:bg-teal-600/12 blur-[140px]" />
          <div className="absolute left-1/3 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 dark:bg-cyan-500/12 blur-[120px]" />
        </div>

        <div className="relative z-10 flex w-full">
          <div className="print:hidden">
            <DoctorNavRail />
          </div>

          <div className="flex min-w-0 flex-1 max-w-full overflow-x-hidden flex-col print:p-0 print:m-0">
            <div className="print:hidden">
              <DoctorMobileTopBar />
            </div>

            <main className="mx-auto w-full max-w-6xl flex-1 page-transition print:p-0 print:m-0 print:max-w-none px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-28 sm:pb-24 lg:pb-12">
              {children}
            </main>

            <div className="print:hidden">
              <DoctorMobileTabBar />
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
