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
import {
  mockMedications,
  mockAppointments,
  mockDocuments,
} from "@/lib/mock-data";
import { formatDate, formatTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [loggedMeds, setLoggedMeds] = useState<Record<string, boolean>>({
    "med-1": true,
    "med-2": true,
    "med-3": true,
    "med-4": false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitals, setVitals] = useState({
    glucose: 118,
    systolic: 122,
    diastolic: 78,
    heartRate: 72,
  });
  const [glucoseInput, setGlucoseInput] = useState("118");
  const [sysInput, setSysInput] = useState("122");
  const [diaInput, setDiaInput] = useState("78");
  const [hrInput, setHrInput] = useState("72");
  const [glucoseType, setGlucoseType] = useState<"fasting" | "postprandial">("fasting");
  const [logAlert, setLogAlert] = useState<string | null>(null);

  const nextAppointment =
    mockAppointments.find((a) => a.status === "upcoming") || mockAppointments[0];
  const pendingReviewDocs = mockDocuments.filter((d) => d.status === "needs_review");
  const takenCount = Object.values(loggedMeds).filter(Boolean).length;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const toggleMed = (medId: string) => {
    setLoggedMeds((prev) => ({
      ...prev,
      [medId]: !prev[medId],
    }));
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const g = parseInt(glucoseInput) || vitals.glucose;
    const s = parseInt(sysInput) || vitals.systolic;
    const d = parseInt(diaInput) || vitals.diastolic;
    const hr = parseInt(hrInput) || vitals.heartRate;

    setVitals({
      glucose: g,
      systolic: s,
      diastolic: d,
      heartRate: hr,
    });
    setShowVitalsModal(false);
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
          {/* Health Overview Hero */}
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
                Type 2 Diabetes & HTN · Managed
              </span>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center justify-center">
            <ProgressRing percent={88} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold text-[var(--foreground)]">88%</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                Optimal
              </span>
            </div>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-[var(--muted-foreground)]">Recovery progress</span>
            <span className="text-emerald-700">HbA1c 6.8% · Goal &lt; 7.0%</span>
          </div>
          <div className="soft-inset h-3 w-full overflow-hidden rounded-full p-0.5">
            <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" />
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
                118 mg/dL
              </span>
            </div>
          </div>
          <div className="soft-inset flex items-center gap-3 rounded-xl p-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] truncate">
                eGFR kidney
              </span>
              <span className="text-xs font-extrabold text-[var(--foreground)] truncate block">
                68 · Stable
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Logged Vitals Success Alert */}
      {logAlert && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="truncate">{logAlert}</span>
        </section>
      )}

      {/* Today's Focus Section */}
      <section>
        <div className="mb-4 flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Today's Focus
          </h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Appointment Card */}
          <div className="soft-card flex items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-extrabold text-white shadow-md shadow-emerald-500/20">
                CW
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
                <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 truncate">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {formatDate(nextAppointment.appointment_date)} at {formatTime(nextAppointment.appointment_time)}
                  </span>
                </span>
              </div>
            </div>

            <Link
              href="/appointments"
              className="shrink-0 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              Prep
            </Link>
          </div>

          {/* Medications Card */}
          <div className="soft-card divide-y divide-[var(--border)] overflow-hidden">
            {mockMedications.slice(0, 3).map((med) => {
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
                          : "border-[var(--border)] bg-white"
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
                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {med.strength}
                        </span>
                      </div>
                      <span className="mt-0.5 block truncate text-[11px] text-[var(--muted-foreground)]">
                        {med.frequency}
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

      {/* Health Metrics */}
      <section>
        <div className="mb-4 flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Health Metrics
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
                  {vitals.glucose}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">mg/dL</span>
              </div>
              <span className="mt-1 block text-[10px] font-bold text-emerald-600 truncate">
                In target (70–130)
              </span>
            </div>
            <div className="mt-4 flex h-10 items-end gap-2">
              {[4, 6, 5, 7, 8].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-emerald-400/80"
                  style={{ height: `${h * 12.5}%`, opacity: 0.35 + i * 0.15 }}
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
                  {vitals.systolic}/{vitals.diastolic}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">mmHg</span>
              </div>
              <span className="mt-1 block text-[10px] font-bold text-emerald-600 truncate">
                Normal seated
              </span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${
                    i < 6 ? "bg-emerald-500" : "bg-[var(--border)]"
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
                <span className="text-2xl font-extrabold text-emerald-700">6.8%</span>
                <span className="text-xs text-[var(--muted-foreground)]">Nov 2026</span>
              </div>
              <span className="mt-1 block text-[10px] font-bold text-emerald-600 truncate">
                −0.3% improved
              </span>
            </div>
            <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-400">
              <span className="absolute top-1/2 left-[42%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-600 shadow-sm" />
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
                  {takenCount} of 4
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">today</span>
              </div>
              <span className="mt-1 block text-[10px] font-bold text-emerald-600 truncate">
                Daily protocol active
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2.5 flex-1 rounded-full ${
                    i < takenCount ? "bg-emerald-500" : "bg-[var(--border)]"
                  }`}
                />
              ))}
            </div>
          </Link>
        </div>
      </section>
        </>
      )}

      {/* Quick Vitals Logger Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3.5 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Log Daily Biometrics
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Encrypted patient entry · Elena Vance
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
              {/* Glucose Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Blood Glucose</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setGlucoseType("fasting")}
                      className={`px-2 py-0.5 rounded-lg transition-colors ${
                        glucoseType === "fasting"
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-600 border border-slate-200"
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
                          : "bg-white text-slate-600 border border-slate-200"
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
                    className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">mg/dL</span>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Target for Elena: 70–130 mg/dL (HbA1c &lt; 7.0%)
                </span>
              </div>

              {/* Blood Pressure Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <span className="font-bold text-slate-800 block">Blood Pressure & Pulse</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Systolic</label>
                    <input
                      type="number"
                      required
                      min="70"
                      max="240"
                      value={sysInput}
                      onChange={(e) => setSysInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Diastolic</label>
                    <input
                      type="number"
                      required
                      min="40"
                      max="140"
                      value={diaInput}
                      onChange={(e) => setDiaInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Pulse (bpm)</label>
                    <input
                      type="number"
                      required
                      min="40"
                      max="200"
                      value={hrInput}
                      onChange={(e) => setHrInput(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
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
