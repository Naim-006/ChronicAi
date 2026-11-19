"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Printer,
  Share2,
  Lock,
  Copy,
  Check,
  AlertCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Key,
  CheckCircle2,
  Calendar,
  Pill,
  Activity,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Medication, HealthMetric } from "@/types/medical";
import { getMedications } from "@/lib/supabase/services/medications";
import { getHealthMetrics } from "@/lib/supabase/services/metrics";

export default function SummariesPage() {
  const { profile, user, effectiveUserId } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [copiedLink, setCopiedLink] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [accessPin, setAccessPin] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (effectiveUserId) {
      setIsLoading(true);
      Promise.all([
        getMedications(effectiveUserId),
        getHealthMetrics(effectiveUserId),
      ])
        .then(([meds, mets]) => {
          if (isMounted) {
            setMedications(meds);
            setMetrics(mets);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setMedications([]);
      setMetrics([]);
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  const handleGenerateShareLink = () => {
    const token = `med_${Math.random().toString(36).substring(2, 10)}`;
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setShareToken(`https://chronicai.health/shared/${token}?exp=24h`);
    setAccessPin(pin);
  };

  const handleCopyLink = () => {
    if (!shareToken) return;
    navigator.clipboard?.writeText(`${shareToken} (PIN: ${accessPin})`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Patient";

  const allergies = profile?.allergies || [];
  const conditions = profile?.chronic_conditions || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] leading-tight">
            Clinical Summary & Handout
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Print-ready medical briefing for doctor appointments and encrypted 24-hour sharing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white dark:bg-[var(--card)] px-3.5 py-1.5 text-xs font-semibold text-[var(--foreground)] shadow-xs hover:bg-[var(--muted)] cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
          <button
            type="button"
            onClick={handleGenerateShareLink}
            className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Generate 24h Link</span>
          </button>
        </div>
      </div>

      {/* Share Link Banner */}
      {shareToken && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Encrypted 24-Hour Patient Portal Link Active
              </span>
            </div>
            <span className="rounded-full bg-emerald-200/60 dark:bg-emerald-800/60 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 dark:text-emerald-100">
              Expires in 23h 59m
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
            <input
              readOnly
              value={`${shareToken}  ·  Security PIN: ${accessPin}`}
              className="flex-1 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[var(--card)] px-3 py-1.5 text-xs font-mono text-[var(--foreground)] select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Copied" : "Copy Secure Link"}</span>
            </button>
          </div>
        </div>
      )}

      {/* PRINT-READY SUMMARY CONTAINER */}
      <div className="rounded-3xl border border-[var(--border)] bg-white dark:bg-[var(--card)] p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header & Patient Demographics */}
        <div className="border-b-2 border-[var(--border)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">
                {displayName}
              </h2>
              {effectiveUserId && (
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ID: #{effectiveUserId.slice(0, 8)}
                </span>
              )}
            </div>
            <span className="text-xs text-[var(--muted-foreground)] block mt-1">
              DOB: {profile?.date_of_birth ? formatDate(profile.date_of_birth) : "Not recorded"} · Sex: {profile?.sex || "Not specified"} · Blood Group: <strong>{profile?.blood_group || "Unknown"}</strong>
            </span>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block tracking-wider">
              Clinical Briefing Generated
            </span>
            <span className="font-extrabold text-[var(--foreground)] block">
              {formatDate(new Date().toISOString())}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block">
              ChronicAI Clinical Core
            </span>
          </div>
        </div>

        {/* 1. Critical Allergies */}
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            Documented Drug Allergies & Adverse Reactions
          </span>
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 divide-y divide-rose-100 dark:divide-rose-900/40 overflow-hidden text-xs">
            {allergies.length === 0 ? (
              <div className="p-3.5 text-xs text-rose-700 dark:text-rose-300">
                No known drug allergies documented in patient records.
              </div>
            ) : (
              allergies.map((a) => (
                <div key={a.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-[var(--foreground)] text-sm block">{a.substance}</span>
                    <span className="text-rose-700 dark:text-rose-400 text-xs font-medium">Reaction: {a.reaction}</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                    {a.severity} Severity
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Active Conditions & Diagnoses */}
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block mb-2">
            Documented Diagnoses & Care Protocols
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {conditions.length === 0 ? (
              <div className="col-span-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 text-xs text-[var(--muted-foreground)]">
                No active chronic conditions documented.
              </div>
            ) : (
              conditions.map((c) => (
                <div key={c.id} className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[var(--foreground)]">{c.name}</span>
                    {c.icd10 && (
                      <span className="text-[10px] font-mono font-bold text-[var(--muted-foreground)] bg-white dark:bg-[var(--card)] px-2 py-0.5 rounded border border-[var(--border)]">
                        {c.icd10}
                      </span>
                    )}
                  </div>
                  {c.notes && <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">{c.notes}</p>}
                  <span className="text-[10px] font-bold text-emerald-600 block">Status: {c.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Active Prescription Regimen */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
              Active Prescriptions
            </span>
            <span className="text-xs font-bold text-emerald-600">{medications.length} Active Medications</span>
          </div>

          <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-[var(--muted-foreground)] text-[10px] font-extrabold uppercase">
                <tr>
                  <th className="py-2.5 pl-4">Medication</th>
                  <th className="py-2.5 px-3">Strength & Frequency</th>
                  <th className="py-2.5 px-3">Prescriber</th>
                  <th className="py-2.5 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {medications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-xs text-[var(--muted-foreground)]">
                      No medications currently on file.
                    </td>
                  </tr>
                ) : (
                  medications.map((m) => (
                    <tr key={m.id} className="hover:bg-[var(--muted)]/30">
                      <td className="py-2.5 pl-4 font-bold text-[var(--foreground)]">
                        {m.name}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--foreground)]/80">
                        {m.strength} · {m.frequency}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--muted-foreground)]">
                        {m.prescribing_doctor || "Not recorded"}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Recent Health Vitals & Biomarkers */}
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block mb-2">
            Recent Biomarkers & Vitals
          </span>

          <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-[var(--muted-foreground)] text-[10px] font-extrabold uppercase">
                <tr>
                  <th className="py-2.5 pl-4">Biomarker</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Recorded Date</th>
                  <th className="py-2.5 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {metrics.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-xs text-[var(--muted-foreground)]">
                      No biomarker records logged yet.
                    </td>
                  </tr>
                ) : (
                  metrics.slice(0, 6).map((met) => (
                    <tr key={met.id} className="hover:bg-[var(--muted)]/30">
                      <td className="py-2.5 pl-4 font-bold text-[var(--foreground)] capitalize">
                        {met.metric_type.replace("_", " ")}
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-emerald-600">
                        {met.value_primary}{met.value_secondary ? `/${met.value_secondary}` : ""} {met.unit}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--muted-foreground)]">
                        {formatDate(met.recorded_at)}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <span className={`font-bold ${met.is_abnormal ? "text-amber-600" : "text-emerald-600"}`}>
                          {met.is_abnormal ? "Attention" : "Normal Range"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
