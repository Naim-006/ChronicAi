"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  UserPlus,
  KeyRound,
  FileEdit,
  ArrowRight,
  ShieldAlert,
  Stethoscope,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestAccessModal } from "@/components/doctor/RequestAccessModal";
import {
  getDoctorClinics,
  getClinicQueue,
  updateVisitTokenStatus,
  QueueItem,
} from "@/lib/supabase/services/queue";
import { getDoctorFollowUps } from "@/lib/supabase/services/consultation";

export default function DoctorDashboardPage() {
  const { user, profile, doctorProfile } = useAuth();
  const { t } = useLanguage();
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [followUpsDueCount, setFollowUpsDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const doctorName =
    doctorProfile?.full_name ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    "Doctor";
  const specialty = doctorProfile?.specialty || "Physician";
  const bmdcNo = doctorProfile?.bmdc_number || "Verified BMDC";

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const fetchDashboardQueue = async () => {
    try {
      setLoading(true);
      const cls = await getDoctorClinics();
      if (cls.length > 0) {
        const items = await getClinicQueue(cls[0].id);
        setQueue(items);
      }
      if (doctorProfile?.id) {
        const fus = await getDoctorFollowUps(doctorProfile.id);
        const today = new Date().toISOString().split("T")[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
        const due = fus.filter(
          (f) => f.status === "scheduled" && f.scheduled_date <= nextWeek
        ).length;
        setFollowUpsDueCount(due);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardQueue();
  }, []);

  const waitingPatients = queue.filter((i) => i.status === "waiting");
  const inProgressPatients = queue.filter((i) => i.status === "in_progress");
  const completedPatients = queue.filter((i) => i.status === "completed");

  const waitingCount = waitingPatients.length;
  const inProgressCount = inProgressPatients.length;
  const completedCount = completedPatients.length;

  const handleCallNext = async () => {
    if (waitingPatients.length === 0) return;
    const nextPatient = waitingPatients[0];
    await updateVisitTokenStatus(nextPatient.id, "in_progress");
    await fetchDashboardQueue();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {doctorName}
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300/60 dark:border-emerald-600/40 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {bmdcNo}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {specialty} · Chamber Live Queue & Clinical Management
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/80 dark:bg-card/80 border border-slate-200/80 dark:border-border/60 text-slate-600 dark:text-slate-300 shadow-xs">
            {currentDate}
          </span>
          <Button
            size="sm"
            onClick={handleCallNext}
            disabled={waitingCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs rounded-xl"
          >
            <Play className="h-3.5 w-3.5 mr-1 fill-current" />
            Call Next Patient {waitingCount > 0 && `(#${waitingPatients[0]?.serial_number})`}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Waiting in Queue"
          value={waitingCount}
          unit="patients"
          subtitle={waitingCount > 0 ? `Est. wait: ~${waitingCount * 10} mins` : "Queue is clear"}
          icon={Users}
          status="normal"
        />
        <StatCard
          title="In Consultation"
          value={inProgressCount}
          subtitle={inProgressCount > 0 ? "Chamber 1 Active" : "No active session"}
          icon={Clock}
          status={inProgressCount > 0 ? "normal" : "neutral"}
        />
        <StatCard
          title="Completed Today"
          value={completedCount}
          unit="seen"
          subtitle="Target: 40-50/day"
          icon={CheckCircle2}
          status="normal"
        />
        <StatCard
          title="Follow-ups Due"
          value={followUpsDueCount}
          subtitle="High priority reviews"
          icon={AlertCircle}
          status={followUpsDueCount > 0 ? "warning" : "normal"}
        />
      </div>

      {/* Quick Action Dock */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 p-4 sm:p-5 backdrop-blur-md shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Clinical Quick Actions
            </h2>
          </div>
          <Link
            href="/doctor/queue"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            Full Queue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/doctor/queue?action=new-visit"
            className="flex flex-col items-start gap-1 p-3 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.03] hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform">
              <UserPlus className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">
              Issue Daily Serial
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Assign visit token
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsAccessModalOpen(true)}
            className="flex flex-col items-start gap-1 p-3 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.03] hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group cursor-pointer text-left w-full"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 group-hover:scale-105 transition-transform">
              <KeyRound className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">
              Request Consent
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Lookup by Patient Code
            </span>
          </button>

          <Link
            href="/doctor/consultations?action=new"
            className="flex flex-col items-start gap-1 p-3 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.03] hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 group-hover:scale-105 transition-transform">
              <FileEdit className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">
              Write Rx & Note
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              E-prescription sync
            </span>
          </Link>

          <Link
            href="/doctor/patients"
            className="flex flex-col items-start gap-1 p-3 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.03] hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 group-hover:scale-105 transition-transform">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">
              Pre-Visit Briefs
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              AI source-cited brief
            </span>
          </Link>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chamber Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Live Chamber Queue
            </h2>
            <Link
              href="/doctor/queue"
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              View Full Queue
            </Link>
          </div>

          {waitingPatients.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 p-8 backdrop-blur-md text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No Patients Currently in Queue
              </h3>
              <p className="max-w-md mx-auto text-xs text-slate-500 dark:text-slate-400">
                Patients will appear here when their daily visit tokens are registered at reception
                or when they scan their ChronicAI check-in code.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <Link href="/doctor/queue">
                  <Button size="sm" variant="outline" className="rounded-xl">
                    Open Queue Manager
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-card/90 divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden shadow-xs">
              {waitingPatients.slice(0, 4).map((pt) => (
                <div key={pt.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      #{pt.serial_number}
                    </span>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        {pt.patient_name || `Patient #${pt.serial_number}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Priority: <strong className="uppercase">{pt.priority}</strong>
                      </span>
                    </div>
                  </div>
                  <Link href="/doctor/queue">
                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg">
                      <PhoneCall className="h-3 w-3 mr-1" /> Call
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Follow-up Alerts & Red Flags */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Follow-ups & Alerts
            </h2>
            <Link
              href="/doctor/follow-ups"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Manage
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 p-5 backdrop-blur-md space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                  Follow-up Adherence Tracker
                </span>
                <span className="text-amber-700 dark:text-amber-300/90 text-[11px] block mt-0.5">
                  ChronicAI monitors patient follow-up dates and flags overdue diabetic or hypertensive reviews.
                </span>
              </div>
            </div>

            <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400">
              No urgent clinical alerts for today.
            </div>
          </div>
        </div>
      </div>

      {/* Request Access Modal */}
      <RequestAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
      />
    </div>
  );
}
