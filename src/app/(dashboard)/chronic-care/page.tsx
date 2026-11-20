"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Pill,
  Stethoscope,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { Medication } from "@/types/medical";
import { getMedications } from "@/lib/supabase/services/medications";
import { useRealtimeTable } from "@/hooks/useRealtime";

export default function ChronicCarePage() {
  const { effectiveUserId, profile } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMeds = React.useCallback(async () => {
    if (!effectiveUserId) {
      setMedications([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await getMedications(effectiveUserId);
      setMedications(data || []);
    } catch {
      setMedications([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadMeds();
  }, [loadMeds]);

  useRealtimeTable({
    table: "medications",
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadMeds();
    },
  });

  const activeMeds = medications.filter(
    (m) =>
      m.related_condition?.toLowerCase().includes("diabetes") ||
      m.related_condition?.toLowerCase().includes("metabolic") ||
      m.status === "active"
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Protocols"
        title="Personalized Care Protocol"
        description={
          profile?.chronic_conditions && profile.chronic_conditions.length > 0
            ? `${profile.chronic_conditions.join(" · ")} · Managed care plan`
            : "Personalized Chronic Condition Management Protocol"
        }
        actions={
          <Link
            href="/assistant"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 px-3 text-xs font-semibold text-white shadow-md shadow-emerald-600/25 transition-all hover:from-emerald-400 hover:to-green-500 active:scale-[0.98]"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            Consult Copilot
          </Link>
        }
      />

      {/* Target status */}
      <section className="soft-card space-y-3.5 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              Care plan: Active Protocol
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-500/20">
            ADA 2026 Clinical Guidelines
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1 sm:grid-cols-4 sm:gap-3">
          <div className="soft-inset rounded-2xl p-3 text-center">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Target HbA1c
            </span>
            <div className="mt-1 text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              &lt; 7.0%
            </div>
          </div>
          <div className="soft-inset rounded-2xl p-3 text-center">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fasting Goal
            </span>
            <div className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white">
              80 – 130
            </div>
          </div>
          <div className="soft-inset rounded-2xl p-3 text-center">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Blood Pressure
            </span>
            <div className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white">
              &lt; 130/80
            </div>
          </div>
          <div className="soft-inset rounded-2xl p-3 text-center">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Renal Target
            </span>
            <div className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white">
              eGFR &gt; 60
            </div>
          </div>
        </div>
      </section>

      {/* Associated medications */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Assigned prescription regimen
        </span>
        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            </div>
          ) : activeMeds.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
              No medications linked to this care plan yet.
            </div>
          ) : (
            activeMeds.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--foreground)]">{med.name}</span>
                      {med.strength && (
                        <span className="rounded-lg bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                          {med.strength}
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 block text-[11px] text-[var(--muted-foreground)]">
                      {med.frequency} {med.instructions ? `· ${med.instructions}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Screening cadence */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Preventive screening cadence
        </span>
        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          <div className="flex items-start gap-3 p-3.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Diabetic Retinal Exam
                </span>
                <span className="shrink-0 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">
                  Annual Screening
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Dilated fundus examination negative for diabetic retinopathy. Recommended interval: once every 12 months.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Metabolic Panel &amp; HbA1c
                </span>
                <span className="shrink-0 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">
                  Quarterly Review
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Glycemic control and lipid panel evaluation. Recommended interval: once every 3 months.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Urine Microalbumin (UACR)
                </span>
                <span className="shrink-0 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold">
                  Renal Check
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Renal microalbumin monitoring for early kidney nephropathy detection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
