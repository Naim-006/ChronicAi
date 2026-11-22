"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, ShieldAlert, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function DoctorPendingPage() {
  const router = useRouter();
  const { isDoctor, doctorProfile, refreshDoctorProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  // If now verified, proceed directly to dashboard
  if (isDoctor) {
    router.push("/doctor/dashboard");
    return null;
  }

  const handleRefresh = async () => {
    try {
      setChecking(true);
      await refreshDoctorProfile();
      // If refreshed state sets isDoctor, the guard/hook will redirect
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-12 sm:py-20 text-center space-y-6">
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-card/90 p-8 sm:p-10 backdrop-blur-xl shadow-xl space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            BMDC Verification in Progress
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Your clinical registration has been submitted and is currently awaiting credential verification.
          </p>
        </div>

        {doctorProfile && (
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {doctorProfile.full_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">BMDC Registration:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {doctorProfile.bmdc_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Specialty:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {doctorProfile.specialty}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <span className="font-bold text-amber-600 uppercase tracking-wide text-[10px] bg-amber-100/80 dark:bg-amber-950/80 px-2 py-0.5 rounded">
                Pending Verification
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${checking ? "animate-spin" : ""}`} />
            Check Verification Status
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl text-xs">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Return to Patient Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
