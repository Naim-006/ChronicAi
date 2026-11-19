"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
  Clock,
  Pill,
  ChevronRight,
  AlertCircle,
  Check,
  TrendingDown,
  UploadCloud,
  CheckCircle2,
  Stethoscope,
  Heart,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Medication, Appointment, MedicalDocument, HealthMetric } from "@/types/medical";
import { getMedications, logMedicationAdherence } from "@/lib/supabase/services/medications";
import { getAppointments } from "@/lib/supabase/services/appointments";
import { getDocuments } from "@/lib/supabase/services/documents";
import { getHealthMetrics, logHealthMetric } from "@/lib/supabase/services/metrics";
import { formatDate, formatTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeTables } from "@/hooks/useRealtime";

function ProgressRing({
  percent,
  size = 72,
  stroke = 7,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DashboardPage() {
  const { profile, effectiveUserId } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loggedMeds, setLoggedMeds] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitals, setVitals] = useState<{
    glucose: number | null;
    systolic: number | null;
    diastolic: number | null;
    heartRate: number | null;
  }>({
    glucose: null,
    systolic: null,
    diastolic: null,
    heartRate: null,
  });
  const [glucoseInput, setGlucoseInput] = useState("110");
  const [sysInput, setSysInput] = useState("120");
  const [diaInput, setDiaInput] = useState("80");
  const [hrInput, setHrInput] = useState("72");
  const [glucoseType, setGlucoseType] = useState<"fasting" | "postprandial">("fasting");
  const [logAlert, setLogAlert] = useState<string | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    if (!effectiveUserId) {
      setMedications([]);
      setAppointments([]);
      setDocuments([]);
      setMetrics([]);
      setIsLoading(false);
      return;
    }
    try {
      const [meds, apts, docs, mets] = await Promise.all([
        getMedications(effectiveUserId),
        getAppointments(effectiveUserId),
        getDocuments(effectiveUserId),
        getHealthMetrics(effectiveUserId),
      ]);
      setMedications(meds || []);
      setAppointments(apts || []);
      setDocuments(docs || []);
      setMetrics(mets || []);

      const latestGlucose = (mets || []).find((m) => m.metric_type === "glucose");
      const latestBP = (mets || []).find((m) => m.metric_type === "blood_pressure");
      const latestHR = (mets || []).find((m) => m.metric_type === "heart_rate");

      setVitals({
        glucose: latestGlucose ? latestGlucose.value_primary : null,
        systolic: latestBP ? latestBP.value_primary : null,
        diastolic: latestBP?.value_secondary ? latestBP.value_secondary : null,
        heartRate: latestHR ? latestHR.value_primary : null,
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Supabase Realtime Subscription: auto-syncs live updates across tables
  useRealtimeTables({
    tables: [
      "medications",
      "medication_logs",
      "appointments",
      "medical_documents",
      "health_metrics",
      "health_profiles",
    ],
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      fetchDashboardData();
    },
  });

  const nextAppointment =
    appointments.find((a) => a.status === "upcoming") || null;
  const pendingReviewDocs = documents.filter((d) => d.status === "needs_review");
  const takenCount = Object.values(loggedMeds).filter(Boolean).length;
  const latestHbA1c = metrics.find((m) => m.metric_type === "hba1c");

  const toggleMed = async (medId: string) => {
    const nextState = !loggedMeds[medId];
    setLoggedMeds((prev) => ({
      ...prev,
      [medId]: nextState,
    }));
    if (effectiveUserId) {
      try {
        await logMedicationAdherence({
          user_id: effectiveUserId,
          medication_id: medId,
          scheduled_time: new Date().toISOString(),
          recorded_time: new Date().toISOString(),
          status: nextState ? "taken" : "missed",
        });
      } catch {}
    }
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    const g = parseInt(glucoseInput) || vitals.glucose || 110;
    const s = parseInt(sysInput) || vitals.systolic || 120;
    const d = parseInt(diaInput) || vitals.diastolic || 80;
    const hr = parseInt(hrInput) || vitals.heartRate || 72;

    setVitals({
      glucose: g,
      systolic: s,
      diastolic: d,
      heartRate: hr,
    });
    setShowVitalsModal(false);

    if (effectiveUserId) {
      try {
        await Promise.all([
          logHealthMetric({
            user_id: effectiveUserId,
            metric_type: "glucose",
            value_primary: g,
            unit: "mg/dL",
            context: glucoseType,
            recorded_at: new Date().toISOString(),
          }),
          logHealthMetric({
            user_id: effectiveUserId,
            metric_type: "blood_pressure",
            value_primary: s,
            value_secondary: d,
            unit: "mmHg",
            recorded_at: new Date().toISOString(),
          }),
          logHealthMetric({
            user_id: effectiveUserId,
            metric_type: "heart_rate",
            value_primary: hr,
            unit: "bpm",
            recorded_at: new Date().toISOString(),
          }),
        ]);
      } catch (err) {
        console.error("Failed to log metrics:", err);
      }
    }

    setLogAlert(`Vitals recorded! Fasting Glucose updated to ${g} mg/dL and BP to ${s}/${d} mmHg.`);
    setTimeout(() => setLogAlert(null), 4000);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <>
          {/* Skeleton loading state */}
          <section className="soft-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3.5 w-full" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <div className="soft-card divide-y divide-[var(--border)] overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
      {/* Quick Health Matrix */}
      <section>
        <div className="mb-4 flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Quick Health Matrix
          </h3>
          <Link
            href="/metrics"
            className="text-xs font-bold text-emerald-600 hover:underline"
          >
            Analytics
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Link
            href="/metrics"
            className="soft-card hover-lift flex flex-col justify-between p-4 transition-all hover:border-emerald-300 sm:p-5 min-w-0"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-[var(--foreground)] truncate pr-1">
                Fasting Glucose
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-[var(--foreground)]">
                  {vitals.glucose !== null ? vitals.glucose : "--"}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">mg/dL</span>
              </div>
              <span className="mt-1 block text-[10px] font-bold text-emerald-600 truncate">
                {vitals.glucose !== null
                  ? vitals.glucose <= 130 && vitals.glucose >= 70
                    ? "In target (70–130)"
                    : "Outside target"
                  : "No readings yet"}
              </span>
            </div>
            <div className="mt-4 flex h-10 items-end gap-2">
              {[4, 6, 5, 7, 8].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-emerald-400/80"
                  style={{
                    height: `${h * 12.5}%`,
                    opacity: vitals.glucose !== null ? 0.35 + i * 0.15 : 0.12,
                  }}
                />
              ))}
            </div>
          </Link>

          <Link
            href="/metrics"
            className="soft-card hover-lift flex flex-col justify-between p-4 transition-all hover:border-emerald-300 sm:p-5 min-w-0"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-[var(--foreground)] truncate pr-1">
                Blood Pressure
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                <Heart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-[var(--foreground)]">
                  {vitals.systolic !== null && vitals.diastolic !== null
                    ? `${vitals.systolic}/${vitals.diastolic}`
                    : "--/--"}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">mmHg</span>
              </div>
              <span className="mt-1 block text-[10px] font-bold text-emerald-600 truncate">
                {vitals.systolic !== null ? "Resting seated" : "No readings yet"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${
                    vitals.systolic !== null && i < 6 ? "bg-emerald-500" : "bg-[var(--border)]"
                  }`}
                />
              ))}
            </div>
          </Link>

          <Link
            href="/metrics"
            className="soft-card hover-lift flex flex-col justify-between p-4 transition-all hover:border-emerald-300 sm:p-5 min-w-0"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-[var(--foreground)] truncate pr-1">
                Latest HbA1c
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-emerald-700">
                  {latestHbA1c ? `${latestHbA1c.value_primary}%` : "--%"}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {latestHbA1c ? formatDate(latestHbA1c.recorded_at) : "No lab test"}
                </span>
              </div>
              <span className="mt-1 block text-[10px] font-bold text-emerald-600 truncate">
                {latestHbA1c
                  ? latestHbA1c.value_primary <= 7.0
                    ? "Optimal range"
                    : "Elevated"
                  : "Log lab report"}
              </span>
            </div>
            <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-400">
              <span
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-600 shadow-sm"
                style={{
                  left: latestHbA1c
                    ? `${Math.min(Math.max((latestHbA1c.value_primary - 4) * 20, 5), 95)}%`
                    : "10%",
                }}
              />
            </div>
          </Link>

          <Link
            href="/medications"
            className="soft-card hover-lift flex flex-col justify-between p-4 transition-all hover:border-emerald-300 sm:p-5 min-w-0"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-[var(--foreground)] truncate pr-1">
                Medications
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                <Pill className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-[var(--foreground)]">
                  {medications.length > 0 ? `${takenCount} of ${medications.length}` : "0"}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {medications.length > 0 ? "today" : "active"}
                </span>
              </div>
              <span className="mt-1 block text-[10px] font-bold text-emerald-600 truncate">
                {medications.length > 0 ? "Daily protocol active" : "No medications logged"}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2.5 flex-1 rounded-full ${
                    medications.length > 0 && i < takenCount
                      ? "bg-emerald-500"
                      : "bg-[var(--border)]"
                  }`}
                />
              ))}
            </div>
          </Link>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="mb-4 flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Quick Actions
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setShowVitalsModal(true)}
            className="soft-card hover-lift flex items-center gap-3 p-3 sm:p-4 transition-all hover:border-emerald-300 group text-left cursor-pointer min-w-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 bg-emerald-50 text-emerald-600 shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-bold text-[var(--foreground)] leading-tight truncate">
                Log Vitals
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] truncate block">
                BP, Glucose
              </span>
            </div>
          </button>

          <Link
            href="/vault"
            className="soft-card hover-lift flex items-center gap-3 p-3 sm:p-4 transition-all hover:border-emerald-300 group min-w-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 bg-sky-50 text-sky-600 shadow-sm">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-bold text-[var(--foreground)] leading-tight truncate">
                Add Record
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] truncate block">
                PDF, Lab scan
              </span>
            </div>
          </Link>

          <Link
            href="/appointments"
            className="soft-card hover-lift flex items-center gap-3 p-3 sm:p-4 transition-all hover:border-emerald-300 group min-w-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 bg-amber-50 text-amber-600 shadow-sm">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-bold text-[var(--foreground)] leading-tight truncate">
                Visits
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] truncate block">
                Schedule, prep
              </span>
            </div>
          </Link>

          <Link
            href="/assistant"
            className="soft-card hover-lift flex items-center gap-3 p-3 sm:p-4 transition-all hover:border-emerald-300 group min-w-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-bold text-[var(--foreground)] leading-tight truncate">
                Copilot
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] truncate block">
                Clinical guidance
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Logged Vitals Success Alert */}
      {logAlert && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="truncate">{logAlert}</span>
        </section>
      )}

      {/* Today's Activity */}
      <section>
        <div className="mb-4 flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Today's Activity
          </h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Health Overview Card */}
          <section className="soft-card relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-teal-200/20 blur-3xl" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <Heart className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-extrabold text-[var(--foreground)] truncate">
                Health Condition
              </h2>
              <span className="text-[11px] font-semibold text-emerald-600 truncate block">
                {profile?.chronic_conditions && profile.chronic_conditions.length > 0
                  ? profile.chronic_conditions.join(" · ")
                  : "Profile Active"}
              </span>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center justify-center">
            <ProgressRing
              percent={
                medications.length > 0
                  ? Math.round((takenCount / medications.length) * 100)
                  : 100
              }
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold text-[var(--foreground)]">
                {medications.length > 0
                  ? `${Math.round((takenCount / medications.length) * 100)}%`
                  : "100%"}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                {medications.length > 0 && takenCount < medications.length ? "Pending" : "Optimal"}
              </span>
            </div>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-[var(--muted-foreground)]">Health status</span>
            <span className="text-emerald-700">
              {latestHbA1c
                ? `HbA1c ${latestHbA1c.value_primary}% · Recorded ${formatDate(latestHbA1c.recorded_at)}`
                : "Continuous Realtime Care Monitoring"}
            </span>
          </div>
          <div className="soft-inset h-3 w-full overflow-hidden rounded-full p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
              style={{
                width:
                  medications.length > 0
                    ? `${Math.max(Math.round((takenCount / medications.length) * 100), 10)}%`
                    : "100%",
              }}
            />
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-5">
          <div className="soft-inset flex items-center gap-3 rounded-xl p-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <Activity className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] truncate">
                Fasting glucose
              </span>
              <span className="text-xs font-extrabold text-[var(--foreground)] truncate block">
                {vitals.glucose !== null ? `${vitals.glucose} mg/dL` : "Not logged"}
              </span>
            </div>
          </div>
          <div className="soft-inset flex items-center gap-3 rounded-xl p-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <Heart className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] truncate">
                Blood Pressure
              </span>
              <span className="text-xs font-extrabold text-[var(--foreground)] truncate block">
                {vitals.systolic !== null && vitals.diastolic !== null
                  ? `${vitals.systolic}/${vitals.diastolic} mmHg`
                  : "Not logged"}
              </span>
            </div>
          </div>
        </div>
      </section>

          {/* Appointment Card */}
          {nextAppointment ? (
            <div className="soft-card flex items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-extrabold text-white shadow-md shadow-emerald-500/20">
                  {nextAppointment.doctor_name
                    .replace("Dr. ", "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-extrabold text-[var(--foreground)]">
                      {nextAppointment.doctor_name}
                    </span>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  </div>
                  <span className="block truncate text-xs font-medium text-[var(--muted-foreground)]">
                    {nextAppointment.specialty} · {nextAppointment.clinic_or_hospital}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {formatDate(nextAppointment.appointment_date)} at {formatTime(nextAppointment.appointment_time)}
                    </span>
                  </span>
                </div>
              </div>

              <Link
                href="/appointments"
                className="shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 transition-colors hover:bg-emerald-100"
              >
                Prep
              </Link>
            </div>
          ) : (
            <div className="soft-card flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                <Calendar className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>No upcoming consultations scheduled.</span>
              </div>
              <Link
                href="/appointments"
                className="shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 transition-colors hover:bg-emerald-100"
              >
                Book
              </Link>
            </div>
          )}

          {/* Medications Card */}
          {medications.length === 0 ? (
            <div className="soft-card p-6 text-center text-xs text-[var(--muted-foreground)]">
              <Pill className="mx-auto h-6 w-6 text-emerald-600/60 mb-1.5" />
              <span>No daily medications prescribed yet.</span>
            </div>
          ) : (
            <div className="soft-card divide-y divide-[var(--border)] overflow-hidden">
              {medications.slice(0, 3).map((med) => {
                const isTaken = loggedMeds[med.id];
                return (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => toggleMed(med.id)}
                    className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-[var(--secondary)]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all ${
                          isTaken
                            ? "scale-105 border-emerald-500 bg-emerald-500 text-white shadow-sm"
                            : "border-[var(--border)] bg-white dark:bg-[var(--card)]"
                        }`}
                      >
                        {isTaken && <Check className="h-4 w-4 stroke-[3]" />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`truncate text-xs font-bold ${
                              isTaken
                                ? "text-[var(--muted-foreground)] line-through"
                                : "text-[var(--foreground)]"
                            }`}
                          >
                            {med.name}
                          </span>
                          {med.strength && (
                            <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                              {med.strength}
                            </span>
                          )}
                        </div>
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--muted-foreground)]">
                          {med.instructions || med.frequency}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[11px] font-bold ${
                        isTaken ? "text-emerald-600" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      {isTaken ? "Logged" : "Tap"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {pendingReviewDocs.length > 0 && (
        <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/60 p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-xl bg-amber-100 p-2.5 text-amber-800">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-amber-950">
                Verification needed · {pendingReviewDocs[0].file_name}
              </span>
              <p className="mt-0.5 line-clamp-2 text-xs text-amber-800/90">
                New clinical notes parsed. Confirm findings to add them to your
                timeline.
              </p>
              <Link
                href="/vault"
                className="mt-2.5 inline-flex items-center gap-1 rounded-xl bg-amber-800 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-900"
              >
                Review data
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}
        </>
      )}

      {/* Quick Vitals Logger Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3.5 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--card)] text-[var(--foreground)] p-5 sm:p-6 shadow-2xl border border-[var(--border)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--foreground)] leading-tight">
                    Log Daily Biometrics
                  </h3>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    Encrypted personal health entry
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
              {/* Glucose Section */}
              <div className="p-3.5 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--foreground)]">Blood Glucose</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setGlucoseType("fasting")}
                      className={`px-2 py-0.5 rounded-lg transition-colors ${
                        glucoseType === "fasting"
                          ? "bg-emerald-600 text-white"
                          : "bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]"
                      }`}
                    >
                      Fasting
                    </button>
                    <button
                      type="button"
                      onClick={() => setGlucoseType("postprandial")}
                      className={`px-2 py-0.5 rounded-lg transition-colors ${
                        glucoseType === "postprandial"
                          ? "bg-emerald-600 text-white"
                          : "bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]"
                      }`}
                    >
                      Post-Meal
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min="40"
                    max="450"
                    value={glucoseInput}
                    onChange={(e) => setGlucoseInput(e.target.value)}
                    className="flex-1 h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 text-sm font-bold text-[var(--foreground)] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-[var(--muted-foreground)]">mg/dL</span>
                </div>
                <span className="text-[10px] text-[var(--muted-foreground)] block">
                  Target: 70–130 mg/dL (HbA1c &lt; 7.0%)
                </span>
              </div>

              {/* Blood Pressure Section */}
              <div className="p-3.5 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] space-y-2.5">
                <span className="font-bold text-[var(--foreground)] block">Blood Pressure & Pulse</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--muted-foreground)] block mb-1">Systolic</label>
                    <input
                      type="number"
                      required
                      min="70"
                      max="240"
                      value={sysInput}
                      onChange={(e) => setSysInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-bold text-[var(--foreground)] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--muted-foreground)] block mb-1">Diastolic</label>
                    <input
                      type="number"
                      required
                      min="40"
                      max="140"
                      value={diaInput}
                      onChange={(e) => setDiaInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-bold text-[var(--foreground)] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--muted-foreground)] block mb-1">Pulse (bpm)</label>
                    <input
                      type="number"
                      required
                      min="40"
                      max="200"
                      value={hrInput}
                      onChange={(e) => setHrInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-bold text-[var(--foreground)] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-xs font-bold text-white shadow-md shadow-green-600/30 transition-all cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
