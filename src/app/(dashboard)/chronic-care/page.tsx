"use client";

import React from "react";
import Link from "next/link";
import {
  HeartPulse,
  Activity,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  ShieldCheck,
  Pill,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { mockProfile, mockMedications } from "@/lib/mock-data";

export default function ChronicCarePage() {
  const diabetesMeds = mockMedications.filter((m) => m.related_condition?.includes("Diabetes"));

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Diabetes Protocol
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Type 2 Diabetes Mellitus • Managed care plan.
          </p>
        </div>

        <Link
          href="/assistant"
          className="flex items-center gap-1.5 rounded-full bg-teal-800 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-95 transition-all"
        >
          <Sparkles className="h-3 w-3" />
          <span>Ask AI</span>
        </Link>
      </div>

      {/* Target Status Banner */}
      <div className="rounded-2xl border border-teal-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-900">Care Plan Status: Well-Controlled</span>
          </div>
          <span className="text-[11px] font-semibold text-teal-800">Target &lt; 7.0%</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">HbA1c</span>
            <span className="text-base font-extrabold text-teal-900">6.8%</span>
            <span className="text-[9px] text-emerald-700 block font-semibold">Goal Met</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fasting</span>
            <span className="text-base font-extrabold text-slate-900">118</span>
            <span className="text-[9px] text-slate-400 block font-medium">mg/dL</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">eGFR Kidney</span>
            <span className="text-base font-extrabold text-slate-900">68</span>
            <span className="text-[9px] text-slate-500 block font-medium">Stage 2</span>
          </div>
        </div>
      </div>

      {/* Grouped List: Active Glycemic Regimen */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Prescribed Pharmacotherapy
        </span>
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {diabetesMeds.map((med) => (
            <div key={med.id} className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-800 shrink-0">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{med.name}</span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                      {med.strength}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {med.frequency} • {med.instructions}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped List: Preventive Screening Cadence */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Preventive Screening Cadence
        </span>
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          <div className="p-3.5 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Diabetic Retinal Exam</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Completed Nov 14
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Valley Eye Center (Dr. Jenkins): Dilated fundus examination negative for retinopathy. Next due Nov 2027.
              </p>
            </div>
          </div>

          <div className="p-3.5 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Metabolic Panel & HbA1c</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Completed Nov 2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Quest Diagnostics: HbA1c 6.8%, Fasting Glucose 118. Next quarterly review due Feb 2027.
              </p>
            </div>
          </div>

          <div className="p-3.5 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Urine Microalbumin (UACR)</span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Discussion Dec 8
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Renal microalbumin monitoring for Stage 2 CKD on appointment agenda with Dr. Catherine Wei.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
