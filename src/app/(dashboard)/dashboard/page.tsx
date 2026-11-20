"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  TrendingUp,
  UploadCloud,
  CheckCircle2,
  Stethoscope,
  Heart,
  X,
  Zap,
  ArrowRight,
  Droplets,
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  FileText,
  Target,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Medication, Appointment, MedicalDocument, HealthMetric } from "@/types/medical";
import {
  getMedications,
  getMedicationLogs,
  logMedicationAdherence,
  untakeMedicationAdherence,
} from "@/lib/supabase/services/medications";
import { getAppointments } from "@/lib/supabase/services/appointments";
import { getDocuments } from "@/lib/supabase/services/documents";
import { getHealthMetrics, logHealthMetric } from "@/lib/supabase/services/metrics";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeTables } from "@/hooks/useRealtime";

type TimeRange = "7D" | "30D" | "3M" | "1Y";

export default function DashboardPage() {
  const { profile, effectiveUserId } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [timeRange, setTimeRange] = useState<TimeRange>("7D");
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

  const { todayUtc, todayLocal } = useMemo(() => {
    const d = new Date();
    const utc = d.toISOString().split("T")[0];
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { todayUtc: utc, todayLocal: local };
  }, []);

  // Instant mount hydration from cache before network responds
  useEffect(() => {
    if (typeof window !== "undefined" && effectiveUserId) {
      try {
        const cacheKey = `chronicai_med_taken_${effectiveUserId}_${todayLocal}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setLoggedMeds(JSON.parse(cached));
        }
      } catch {}
    }
  }, [effectiveUserId, todayLocal]);

  const fetchDashboardData = useCallback(async () => {
    if (!effectiveUserId) {
      setMedications([]);
      setAppointments([]);
      setDocuments([]);
      setMetrics([]);
      setIsLoading(false);
      return;
    }
    try {
      const [meds, apts, docs, mets, logs] = await Promise.all([
        getMedications(effectiveUserId),
        getAppointments(effectiveUserId),
        getDocuments(effectiveUserId),
        getHealthMetrics(effectiveUserId),
        getMedicationLogs(effectiveUserId, 14),
      ]);
      setMedications(meds || []);
      setAppointments(apts || []);
      setDocuments(docs || []);
      setMetrics(mets || []);

      // Filter and evaluate today's medication logs
      const nowMs = Date.now();
      const todayLogs = (logs || []).filter((l) => {
        const timeMs = new Date(l.recorded_time || l.scheduled_time || l.created_at || "").getTime();
        const isWithin24h = !isNaN(timeMs) && nowMs - timeMs < 24 * 60 * 60 * 1000 && timeMs <= nowMs + 60 * 60 * 1000;
        const matchesDate =
          l.scheduled_time?.startsWith(todayUtc) ||
          l.scheduled_time?.startsWith(todayLocal) ||
          l.recorded_time?.startsWith(todayUtc) ||
          l.recorded_time?.startsWith(todayLocal) ||
          l.created_at?.startsWith(todayUtc) ||
          l.created_at?.startsWith(todayLocal);
        return isWithin24h || matchesDate;
      });

      const initialMap: Record<string, boolean> = {};
      (meds || []).forEach((m) => {
        initialMap[m.id] = false;
      });
      const sortedTodayLogs = [...todayLogs].sort((a, b) => {
        const timeA = new Date(a.recorded_time || a.created_at || 0).getTime();
        const timeB = new Date(b.recorded_time || b.created_at || 0).getTime();
        return timeA - timeB;
      });
      sortedTodayLogs.forEach((l) => {
        initialMap[l.medication_id] = l.status === "taken";
      });

      try {
        const cacheKey = `chronicai_med_taken_${effectiveUserId}_${todayLocal}`;
        localStorage.setItem(cacheKey, JSON.stringify(initialMap));
      } catch {}

      setLoggedMeds(initialMap);

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
  }, [effectiveUserId, todayUtc, todayLocal]);

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

  // Clinical Profile & Conditions Analysis
  const userConditions = useMemo(() => {
    if (!profile?.chronic_conditions) return [];
    return profile.chronic_conditions.map((c: any) =>
      typeof c === "string" ? c : c.name || ""
    ).filter(Boolean);
  }, [profile?.chronic_conditions]);

  const hasDiabetes = useMemo(
    () => userConditions.some((c) => /diabet|glucose|sugar/i.test(c)),
    [userConditions]
  );
  const hasHypertension = useMemo(
    () => userConditions.some((c) => /hypertens|blood pressure|bp/i.test(c)),
    [userConditions]
  );
  const hasKidney = useMemo(
    () => userConditions.some((c) => /kidney|ckd|renal|nephro/i.test(c)),
    [userConditions]
  );
  const isHealthyGeneral = userConditions.length === 0;

  // Real Metric Values filtered by user selected timeRange
  const timeFilteredMetrics = useMemo(() => {
    const now = Date.now();
    const daysMap: Record<TimeRange, number> = { "7D": 7, "30D": 30, "3M": 90, "1Y": 365 };
    const cutoff = now - daysMap[timeRange] * 24 * 60 * 60 * 1000;
    return metrics.filter((m) => new Date(m.recorded_at).getTime() >= cutoff);
  }, [metrics, timeRange]);

  const glucoseReadings = useMemo(() => {
    return timeFilteredMetrics
      .filter((m) => m.metric_type === "glucose")
      .map((m) => m.value_primary);
  }, [timeFilteredMetrics]);

  const avgGlucose = useMemo(() => {
    if (glucoseReadings.length === 0) return vitals.glucose;
    const sum = glucoseReadings.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / glucoseReadings.length);
  }, [glucoseReadings, vitals.glucose]);

  const latestHbA1c = useMemo(() => {
    return metrics.find((m) => m.metric_type === "hba1c") || null;
  }, [metrics]);

  const latestCreatinine = useMemo(() => {
    return metrics.find((m) => /creatinine/i.test(m.metric_type) || /creatinine/i.test(m.notes || "")) || null;
  }, [metrics]);

  const latestPlatelets = useMemo(() => {
    return metrics.find((m) => /platelet/i.test(m.metric_type) || /platelet/i.test(m.notes || "")) || null;
  }, [metrics]);

  const nextAppointment = useMemo(() => {
    return appointments.find((a) => a.status === "upcoming") || null;
  }, [appointments]);

  const pendingReviewDocs = useMemo(() => {
    return documents.filter((d) => d.status === "needs_review");
  }, [documents]);

  const takenCount = useMemo(() => {
    return Object.values(loggedMeds).filter(Boolean).length;
  }, [loggedMeds]);

  const remainingDosesCount = Math.max(0, medications.length - takenCount);

  // Toggle dose taken/untaken for today
  const toggleMed = async (medId: string) => {
    const nextState = !loggedMeds[medId];
    const newMap = { ...loggedMeds, [medId]: nextState };
    setLoggedMeds(newMap);

    if (effectiveUserId) {
      try {
        localStorage.setItem(
          `chronicai_med_taken_${effectiveUserId}_${todayLocal}`,
          JSON.stringify(newMap)
        );
      } catch {}

      try {
        if (nextState) {
          await logMedicationAdherence({
            user_id: effectiveUserId,
            medication_id: medId,
            scheduled_time: new Date().toISOString(),
            recorded_time: new Date().toISOString(),
            status: "taken",
          });
        } else {
          await untakeMedicationAdherence(medId, effectiveUserId);
        }
      } catch (err) {
        console.error("Failed to toggle medication in dashboard:", err);
        const rollbackMap = { ...loggedMeds, [medId]: !nextState };
        setLoggedMeds(rollbackMap);
        try {
          localStorage.setItem(
            `chronicai_med_taken_${effectiveUserId}_${todayLocal}`,
            JSON.stringify(rollbackMap)
          );
        } catch {}
      }
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

    setLogAlert(`Vitals recorded! Glucose updated to ${g} mg/dL and BP to ${s}/${d} mmHg.`);
    setTimeout(() => setLogAlert(null), 4000);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          <section className="glass-card p-6 rounded-3xl space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          </section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-44 rounded-3xl" />
          </div>
        </div>
      ) : (
        <>
          {/* TOP BANNER: 5 Core Health Questions at a Glance */}
          <section className="glass-card p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-3xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    {isHealthyGeneral ? "General Preventive Health Command" : "Active Chronic Care Protocol"}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {profile?.full_name?.split(" ")[0] || "Patient"}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                  {isHealthyGeneral
                    ? "Your baseline preventive profile is active. Keep track of vitals, preventive screenings, and medical records."
                    : userConditions.length > 0
                    ? `Managing: ${userConditions.slice(0, 3).join(", ")}${userConditions.length > 3 ? ` +${userConditions.length - 3} more` : ""}. All clinical protocols are aligned with evidence-based standards.`
                    : "Your personal health dashboard is ready. Log daily vitals or upload your latest medical reports to get clinical insights."}
                </p>
              </div>

              {/* Status Pill Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs shadow-2xs flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {medications.length > 0
                      ? `${takenCount}/${medications.length} Doses Logged Today`
                      : "Routine Maintenance Active"}
                  </span>
                </div>
                <Link
                  href="/assistant"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Stethoscope className="h-3.5 w-3.5" />
                  <span>Ask AI</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Vitals Success Alert */}
          {logAlert && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/50 p-3.5 text-xs font-bold text-emerald-300 flex items-center gap-2.5 shadow-lg shadow-emerald-500/10 animate-in fade-in">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <span className="truncate">{logAlert}</span>
            </div>
          )}

          {/* Verification Banner if documents need review */}
          {pendingReviewDocs.length > 0 && (
            <div className="glass-card p-4 border-amber-300 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/30 flex items-start justify-between gap-3 shadow-xs rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold text-amber-900 dark:text-amber-200">
                    Clinical Verification Needed ({pendingReviewDocs.length} document{pendingReviewDocs.length > 1 ? "s" : ""})
                  </span>
                  <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/90">
                    Newly parsed medical record: &ldquo;{pendingReviewDocs[0].file_name}&rdquo;. Review and confirm extracted biomarkers before they are finalized.
                  </p>
                </div>
              </div>
              <Link
                href="/vault"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <span>Review OCR</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* SECTION 1: Dynamic Condition-Tailored Health Overview */}
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  {isHealthyGeneral ? "Personal Health Measurements & Targets" : "Clinical Biometrics & Condition Targets"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHealthyGeneral
                    ? "Grounded in evidence-based preventive health guidelines (AHA/ADA)"
                    : "Longitudinal tracking against patient-specific clinical targets"}
                </p>
              </div>

              {/* Time Range Filter & Analytics Link */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex p-1 rounded-full bg-slate-200/60 dark:bg-white/[0.06] backdrop-blur-xl border border-slate-300/60 dark:border-white/10 shadow-inner">
                  {(["7D", "30D", "3M", "1Y"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTimeRange(r)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer",
                        timeRange === r
                          ? "bg-emerald-600 text-white shadow-xs font-black"
                          : "bg-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <Link
                  href="/metrics"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 dark:text-emerald-400 dark:bg-white/[0.06] dark:hover:bg-emerald-500/15 dark:border-white/10 transition-all cursor-pointer"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Analytics</span>
                </Link>
              </div>
            </div>

            {/* Dynamic Vital Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Blood Pressure (Universal Priority) */}
              <div className="glass-card p-4 flex flex-col justify-between group transition-all border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/25">
                      <Heart className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      Blood Pressure
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">ACC/AHA</span>
                </div>

                <div className="my-2.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {vitals.systolic !== null ? `${vitals.systolic}/${vitals.diastolic || 80}` : "--/--"}
                    </span>
                    <span className="text-[11px] text-slate-500">mmHg</span>
                  </div>
                  <span
                    className={cn(
                      "mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full",
                      vitals.systolic && vitals.systolic <= 130
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : vitals.systolic
                        ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300"
                        : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                    )}
                  >
                    {vitals.systolic
                      ? vitals.systolic <= 120
                        ? "Optimal (<120/80)"
                        : vitals.systolic <= 130
                        ? "Controlled (<130/80)"
                        : "Stage 1 Elevation"
                      : "No readings yet"}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Target: &lt;130/80</span>
                  <button
                    type="button"
                    onClick={() => setShowVitalsModal(true)}
                    className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
                  >
                    + Log
                  </button>
                </div>
              </div>

              {/* Card 2: Fasting Glucose / Blood Sugar */}
              <div className="glass-card p-4 flex flex-col justify-between group transition-all border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/25">
                      <Droplets className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      {hasDiabetes ? "Fasting Glucose" : "Blood Glucose"}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">ADA</span>
                </div>

                <div className="my-2.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {avgGlucose !== null ? `${avgGlucose}` : "--"}
                    </span>
                    <span className="text-[11px] text-slate-500">mg/dL</span>
                  </div>
                  <span
                    className={cn(
                      "mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full",
                      avgGlucose && avgGlucose >= 70 && avgGlucose <= 130
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : avgGlucose
                        ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300"
                        : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                    )}
                  >
                    {avgGlucose
                      ? avgGlucose <= 99
                        ? "Normal Fasting (70-99)"
                        : avgGlucose <= 130
                        ? "Target Fasting (80-130)"
                        : "Above Fasting Target"
                      : "No readings yet"}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Target: 70–130 mg/dL</span>
                  <button
                    type="button"
                    onClick={() => setShowVitalsModal(true)}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    + Log
                  </button>
                </div>
              </div>

              {/* Card 3: Condition-Specific or Lab Biomarker */}
              {hasDiabetes ? (
                /* Diabetic: Latest HbA1c */
                <Link
                  href="/metrics"
                  className="glass-card p-4 flex flex-col justify-between group transition-all border border-slate-200/80 dark:border-white/10 hover:border-rose-500/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/25">
                        <Activity className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                        Latest HbA1c
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">Target &lt;7%</span>
                  </div>
                  <div className="my-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {latestHbA1c ? `${latestHbA1c.value_primary}%` : "Not Tested"}
                      </span>
                    </div>
                    <span className="mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300">
                      {latestHbA1c ? `Measured ${formatDate(latestHbA1c.recorded_at)}` : "Recommended every 3-6 mos"}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                    <span>ADA Standard of Care</span>
                    <span>View &rarr;</span>
                  </div>
                </Link>
              ) : latestPlatelets ? (
                /* Hematology / Surveillance: Platelet Count */
                <Link
                  href="/metrics"
                  className="glass-card p-4 flex flex-col justify-between group transition-all border border-slate-200/80 dark:border-white/10 hover:border-purple-500/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/25">
                        <Activity className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                        Platelet Count
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">CBC Panel</span>
                  </div>
                  <div className="my-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {latestPlatelets.value_primary}
                      </span>
                      <span className="text-[11px] text-slate-500">{latestPlatelets.unit || "K/µL"}</span>
                    </div>
                    <span className="mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300">
                      {latestPlatelets.value_primary < 150 ? "Mild Surveillance (100–150)" : "Normal Range (150–450)"}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                    <span>Ref: 150–450 K/µL</span>
                    <span>View &rarr;</span>
                  </div>
                </Link>
              ) : latestCreatinine ? (
                /* Renal: Serum Creatinine */
                <Link
                  href="/metrics"
                  className="glass-card p-4 flex flex-col justify-between group transition-all border border-slate-200/80 dark:border-white/10 hover:border-amber-500/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/25">
                        <Activity className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                        Serum Creatinine
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">KDIGO</span>
                  </div>
                  <div className="my-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {latestCreatinine.value_primary}
                      </span>
                      <span className="text-[11px] text-slate-500">{latestCreatinine.unit || "mg/dL"}</span>
                    </div>
                    <span className="mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300">
                      Normal Filtration Rate
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Ref: 0.70–1.30 mg/dL</span>
                    <span>View &rarr;</span>
                  </div>
                </Link>
              ) : (
                /* General Preventive: Resting Heart Rate / Wellness */
                <div className="glass-card p-4 flex flex-col justify-between group transition-all border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/25">
                        <Activity className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                        Resting Pulse
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">Resting</span>
                  </div>
                  <div className="my-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {vitals.heartRate !== null ? `${vitals.heartRate}` : "--"}
                      </span>
                      <span className="text-[11px] text-slate-500">bpm</span>
                    </div>
                    <span className="mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300">
                      {vitals.heartRate ? (vitals.heartRate <= 85 ? "Optimal Resting Rate" : "Elevated Resting Rate") : "No readings yet"}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Target: 60–100 bpm</span>
                    <button
                      type="button"
                      onClick={() => setShowVitalsModal(true)}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      + Log
                    </button>
                  </div>
                </div>
              )}

              {/* Card 4: Daily Medications & Regimen Adherence */}
              <Link
                href="/medications"
                className="glass-card p-4 flex flex-col justify-between group transition-all border border-slate-200/80 dark:border-white/10 hover:border-teal-500/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/25">
                      <Pill className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      Medication Regimen
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">Today</span>
                </div>

                <div className="my-2.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {medications.length > 0 ? `${takenCount} of ${medications.length}` : "0"}
                    </span>
                    <span className="text-[11px] text-slate-500">taken</span>
                  </div>
                  <span
                    className={cn(
                      "mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full",
                      medications.length === 0
                        ? "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                        : remainingDosesCount === 0
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-300"
                    )}
                  >
                    {medications.length === 0
                      ? "No active prescriptions"
                      : remainingDosesCount === 0
                      ? "All doses taken for today!"
                      : `${remainingDosesCount} dose${remainingDosesCount > 1 ? "s" : ""} remaining`}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                  <span>Adherence Tracker</span>
                  <span>View Schedule &rarr;</span>
                </div>
              </Link>
            </div>
          </section>

          {/* SECTION 2: Functional Quick Actions */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                  Quick Actions
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 1. Log Biometrics */}
              <button
                type="button"
                onClick={() => setShowVitalsModal(true)}
                className="glass-card p-3.5 sm:p-4 flex items-center gap-3 text-left cursor-pointer transition-all border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/5 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/25 transition-transform group-hover:scale-105">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    Log Vitals
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                    BP, Glucose, Pulse
                  </span>
                </div>
              </button>

              {/* 2. Add Record / Upload */}
              <Link
                href="/vault"
                className="glass-card p-3.5 sm:p-4 flex items-center gap-3 transition-all border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 hover:bg-cyan-50/20 dark:hover:bg-cyan-500/5 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/25 transition-transform group-hover:scale-105">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    Add Record
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                    Scan or PDF upload
                  </span>
                </div>
              </Link>

              {/* 3. Screenings & Preventive Tests */}
              <Link
                href="/screenings"
                className="glass-card p-3.5 sm:p-4 flex items-center gap-3 transition-all border border-slate-200/80 dark:border-white/10 hover:border-amber-500/40 hover:bg-amber-50/20 dark:hover:bg-amber-500/5 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/25 transition-transform group-hover:scale-105">
                  <Target className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    Health Screenings
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                    ASCVD & Diabetes Risk
                  </span>
                </div>
              </Link>

              {/* 4. Clinical AI Copilot */}
              <Link
                href="/assistant"
                className="glass-card p-3.5 sm:p-4 flex items-center gap-3 transition-all border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/5 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/25 transition-transform group-hover:scale-105">
                  <Stethoscope className="h-5 w-5 stroke-[2.3] text-slate-950" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    Clinical AI
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                    Grounded consultation
                  </span>
                </div>
              </Link>
            </div>
          </section>

          {/* SECTION 3: Condition Care / Preventive Focus & Today's Schedule */}
          <section className="grid gap-4 lg:grid-cols-2">
            {/* Left: Personalized Care Protocol or Preventive Maintenance */}
            <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {isHealthyGeneral ? "Preventive Health Maintenance" : "Active Clinical Regimen"}
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isHealthyGeneral ? "Primary Prevention & Wellness" : "Chronic condition care & targets"}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={isHealthyGeneral ? "/screenings" : "/chronic-care"}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>{isHealthyGeneral ? "Screenings" : "Manage"}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* Content body based on patient type */}
                {isHealthyGeneral ? (
                  <div className="pt-3 space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Maintaining long-term wellness through routine blood pressure checks, balanced physical activity, and age-appropriate screenings:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5 text-cyan-500" />
                          Cardiovascular Check
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Annual resting BP target &lt;120/80 mmHg. Exercise 150 min/week.
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Droplets className="h-3.5 w-3.5 text-emerald-500" />
                          Glycemic Baseline
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Fasting glucose 70–99 mg/dL. Screen for prediabetes periodically.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 space-y-3">
                    {/* Active Conditions List */}
                    <div className="space-y-2">
                      {userConditions.slice(0, 3).map((cond, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {cond}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            Active Care
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Prescribed Medications Summary */}
                    {medications.length > 0 && (
                      <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-500/20 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                          <span>Active Prescriptions ({medications.length})</span>
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            {takenCount} of {medications.length} taken today
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 truncate">
                          {medications.map((m) => m.name).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  Clinical guidelines: ADA &middot; ACC/AHA &middot; KDIGO
                </span>
                <Link
                  href="/timeline"
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Care Timeline</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Right: Upcoming Consultations & Appointment Prep */}
            <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Consultations & Visits
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Upcoming schedule & clinical visit prep
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/appointments"
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>View all</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="pt-3">
                  {nextAppointment ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                            {nextAppointment.doctor_name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                            {nextAppointment.specialty} &middot; {nextAppointment.clinic_or_hospital}
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 shrink-0">
                          Upcoming
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {formatDate(nextAppointment.appointment_date)} at {formatTime(nextAppointment.appointment_time)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          {nextAppointment.reason || nextAppointment.consultation_notes || "Routine follow-up consultation"}
                        </span>
                        <Link
                          href="/appointments"
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Visit Prep
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        No upcoming consultations scheduled
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-xs">
                        Keep your doctor appointments organized and generate customized discussion agendas with the Clinical Copilot.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10">
                <Link
                  href="/appointments"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-white/5 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Book or Schedule Consultation</span>
                </Link>
              </div>
            </div>
          </section>

          {/* SECTION 4: Today's Medication Adherence Checklist (if patient has meds) */}
          {medications.length > 0 && (
            <section className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Today&apos;s Medication Checklist
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mark doses as taken to maintain your verified clinical adherence record
                  </p>
                </div>
                <Link
                  href="/medications"
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Full Regimen</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {medications.map((med) => {
                  const isTaken = Boolean(loggedMeds[med.id]);
                  return (
                    <div
                      key={med.id}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3",
                        isTaken
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
                          : "bg-white/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 hover:border-slate-300"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                          {med.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          {med.dosage || med.strength} &middot; {med.frequency}
                        </span>
                        {med.instructions && (
                          <span className="text-[10px] text-slate-400 block truncate italic">
                            {med.instructions}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleMed(med.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0",
                          isTaken
                            ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                            : "border border-slate-300 dark:border-white/20 hover:border-emerald-500 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <Check className={cn("h-3.5 w-3.5", isTaken ? "opacity-100" : "opacity-40")} />
                        <span>{isTaken ? "Taken" : "Log"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 5: Footer & Patient Advocacy */}
          <footer className="mt-8 pt-4 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                ChronicAI Clinical Decision Support &middot; Patient Data Encrypted
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 p-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0c1527]/80 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
                title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
                aria-label="Toggle Dark and Light Mode"
              >
                {resolvedTheme === "dark" ? (
                  <Moon className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
              </button>

              <Link
                href="/assistant"
                className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Clinical Support</span>
              </Link>
            </div>
          </footer>
        </>
      )}

      {/* Quick Vitals Logger Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl glass-card bg-white dark:bg-[#0b1324] text-slate-900 dark:text-white p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/25">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Log Health Biometrics
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Encrypted entry into your medical records
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
              {/* Glucose Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Blood Glucose</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setGlucoseType("fasting")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                        glucoseType === "fasting"
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      Fasting
                    </button>
                    <button
                      type="button"
                      onClick={() => setGlucoseType("postprandial")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                        glucoseType === "postprandial"
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      Post-Meal
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={glucoseInput}
                    onChange={(e) => setGlucoseInput(e.target.value)}
                    placeholder="110"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-500 shrink-0">mg/dL</span>
                </div>
              </div>

              {/* Blood Pressure Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Blood Pressure (Systolic / Diastolic)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={sysInput}
                    onChange={(e) => setSysInput(e.target.value)}
                    placeholder="120"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-slate-400 font-bold">/</span>
                  <input
                    type="number"
                    value={diaInput}
                    onChange={(e) => setDiaInput(e.target.value)}
                    placeholder="80"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-500 shrink-0">mmHg</span>
                </div>
              </div>

              {/* Heart Rate Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Resting Heart Rate
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hrInput}
                    onChange={(e) => setHrInput(e.target.value)}
                    placeholder="72"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-500 shrink-0">bpm</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                >
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
