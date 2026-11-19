"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Pill,
  Stethoscope,
} from "lucide-react";
import { mockMedications } from "@/lib/mock-data";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ChronicCarePage() {
  const diabetesMeds = mockMedications.filter((m) => m.related_condition?.includes("Diabetes"));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Protocols"
        title="Diabetes Protocol"
        description="Type 2 Diabetes Mellitus · Managed care plan"
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
      <section className="soft-card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-[var(--foreground)]">
              Care plan: Well-controlled
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700">Target &lt; 7.0%</span>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)]/80 pt-3 text-center">
          <div className="soft-inset p-2.5">
            <span className="block text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              HbA1c
            </span>
            <span className="text-base font-extrabold text-emerald-700">6.8%</span>
            <span className="block text-[9px] font-semibold text-emerald-600">Goal met</span>
          </div>
          <div className="soft-inset p-2.5">
            <span className="block text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              Fasting
            </span>
            <span className="text-base font-extrabold text-[var(--foreground)]">118</span>
            <span className="block text-[9px] font-medium text-[var(--muted-foreground)]">mg/dL</span>
          </div>
          <div className="soft-inset p-2.5">
            <span className="block text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
              eGFR
            </span>
            <span className="text-base font-extrabold text-[var(--foreground)]">68</span>
            <span className="block text-[9px] font-medium text-[var(--muted-foreground)]">Stage 2</span>
          </div>
        </div>
      </section>

      {/* Pharmacotherapy */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Prescribed pharmacotherapy
        </span>
        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          {diabetesMeds.map((med) => (
            <div key={med.id} className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--foreground)]">{med.name}</span>
                    <span className="rounded-lg bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                      {med.strength}
                    </span>
                  </div>
                  <span className="mt-0.5 block text-[11px] text-[var(--muted-foreground)]">
                    {med.frequency} · {med.instructions}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screening cadence */}
      <div>
        <span className="mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          Preventive screening cadence
        </span>
        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden p-0">
          <div className="flex items-start gap-3 p-3.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  Diabetic Retinal Exam
                </span>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Completed Nov 14
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                Valley Eye Center (Dr. Jenkins): Dilated fundus examination negative for retinopathy. Next due Nov 2027.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  Metabolic Panel &amp; HbA1c
                </span>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Completed Nov 2
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                Quest Diagnostics: HbA1c 6.8%, Fasting Glucose 118. Next quarterly review due Feb 2027.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  Urine Microalbumin (UACR)
                </span>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Discussion Dec 8
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                Renal microalbumin monitoring for Stage 2 CKD on appointment agenda with Dr. Catherine Wei.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
