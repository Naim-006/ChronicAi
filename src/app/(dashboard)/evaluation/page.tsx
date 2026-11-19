"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HeartPulse,
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  ChevronRight,
  Info,
  Check,
  Eye,
  FileCheck,
  Calendar,
  Pill,
} from "lucide-react";

export default function HealthEvaluationPage() {
  const [symptomInput, setSymptomInput] = useState("");
  const [evalResult, setEvalResult] = useState<{
    symptom: string;
    level: "low" | "moderate" | "urgent";
    assessment: string;
    action: string;
  } | null>({
    symptom: "Mild Dizziness upon Standing",
    level: "moderate",
    assessment: "Possible orthostatic blood pressure shift secondary to Lisinopril 20mg or hydration.",
    action: "Drink 1 glass of water and rise slowly. If systolic BP drops below 105 mmHg, message Dr. Wei.",
  });

  const handleEvaluateSymptom = (text: string) => {
    const q = text.toLowerCase().trim();
    if (!q) return;

    if (q.includes("chest") || q.includes("pressure") || q.includes("breath")) {
      setEvalResult({
        symptom: text,
        level: "urgent",
        assessment: "Potential cardiopulmonary symptom requiring immediate medical attention.",
        action: "Seek urgent medical care or emergency evaluation immediately.",
      });
    } else if (q.includes("thirst") || q.includes("urination") || q.includes("sugar")) {
      setEvalResult({
        symptom: text,
        level: "moderate",
        assessment: "Osmotic symptom associated with transient glucose excursions above 160 mg/dL.",
        action: "Check fingerstick glucose now and log in ChronicAI. Discuss at next visit if persistent.",
      });
    } else if (q.includes("foot") || q.includes("numb") || q.includes("tingl")) {
      setEvalResult({
        symptom: text,
        level: "low",
        assessment: "Peripheral sensory symptom monitored in diabetic care protocols.",
        action: "Perform daily visual foot checks. Monofilament test scheduled for Dec 8 visit.",
      });
    } else {
      setEvalResult({
        symptom: text,
        level: "low",
        assessment: "Non-acute symptom evaluated against your chronic health baseline.",
        action: "Continue routine tracking and discuss during regular follow-up.",
      });
    }
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-8 max-w-7xl mx-auto px-1 sm:px-2">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
              Health Evaluation
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              Optimal (Score 88)
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Cardiovascular, renal filtration, and preventive quality metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/assistant"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:brightness-105 active:scale-95"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Consult Copilot</span>
          </Link>
        </div>
      </div>

      {/* Main Condition Score Hero Card */}
      <section className="soft-card p-4 sm:p-5 bg-white border border-slate-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/25">
              <div className="text-center">
                <span className="block text-xl font-extrabold leading-none">88</span>
                <span className="text-[9px] font-bold text-emerald-100">/ 100</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  Overall Health Score
                </h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Stable
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Type 2 Diabetes & Hypertension well-managed on current therapy
              </p>
            </div>
          </div>

          {/* 4 Clean Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                A1c (Glycemic)
              </span>
              <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                6.8% <span className="text-[10px] font-normal text-slate-500">Target</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Blood Pressure
              </span>
              <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                120/78 <span className="text-[10px] font-normal text-slate-500">Normal</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Kidney (eGFR)
              </span>
              <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                68 <span className="text-[10px] font-normal text-slate-500">Stage G2</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Meds Adherence
              </span>
              <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                100% <span className="text-[10px] font-normal text-slate-500">4/4 Meds</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: ASCVD Cardiovascular Risk & Renal Health */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Card 1: 10-Year ASCVD Cardiovascular Risk */}
        <section className="soft-card p-4 sm:p-5 space-y-3 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                  10-Year ASCVD Cardiovascular Risk
                </h3>
                <span className="text-[10px] text-slate-400">ACC/AHA Clinical Model</span>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
              Down −2.1%
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">6.4%</span>
              <span className="text-xs font-bold text-emerald-600">Low / Borderline</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Target: &lt; 7.5%</span>
          </div>

          {/* Segmented Risk Gauge */}
          <div className="space-y-1">
            <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div className="h-full w-1/4 bg-emerald-400" />
              <div className="h-full w-1/4 bg-yellow-400" />
              <div className="h-full w-1/4 bg-amber-400" />
              <div className="h-full w-1/4 bg-rose-500" />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-400">
              <span className="text-emerald-700">Low (&lt;5%)</span>
              <span className="text-slate-800 font-extrabold">Current (6.4%)</span>
              <span>Intermediate</span>
              <span>High (&gt;20%)</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100">
            <span className="font-bold text-slate-800">Status: </span>
            Reduced from 8.5% with Atorvastatin 20mg and tight BP control.
          </div>
        </section>

        {/* Card 2: Renal Function & CKD Staging */}
        <section className="soft-card p-4 sm:p-5 space-y-3 bg-white border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                  Renal Function & Filtration
                </h3>
                <span className="text-[10px] text-slate-400">KDIGO CKD Staging</span>
              </div>
            </div>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold text-teal-800 border border-teal-200">
              Stage G2 · Stable
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">68</span>
              <span className="text-xs text-slate-500 font-medium">mL/min/1.73m² (eGFR)</span>
            </div>
            <span className="text-[10px] font-bold text-teal-700">No annual decline</span>
          </div>

          {/* 3 Clean Compact Points */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">Renoprotection</span>
              <span className="font-bold text-emerald-700">Lisinopril 20mg Active</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">Microalbumin/Creatinine</span>
              <span className="font-bold text-slate-800">&lt; 30 mg/g (Normal)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">Medication Safety</span>
              <span className="font-bold text-rose-600">Avoid NSAIDs / Ibuprofen</span>
            </div>
          </div>
        </section>
      </div>

      {/* Preventive Care Checklist (Clean 6-Card Grid) */}
      <section className="soft-card p-4 sm:p-5 space-y-3 bg-white border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
              Preventive Care Measures
            </h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            5 of 6 Complete
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-900">Eye Exam</span>
            <span className="inline-flex items-center justify-center gap-1 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 py-0.5 rounded-md">
              <Check className="h-3 w-3 stroke-[3]" /> Nov 14
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-950">Urine Test</span>
            <span className="mt-1 text-[10px] font-bold text-amber-800 bg-amber-100 py-0.5 rounded-md">
              Due Feb 2027
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-900">Foot Exam</span>
            <span className="mt-1 text-[10px] font-bold text-blue-800 bg-blue-100/70 py-0.5 rounded-md">
              Dec 8 Visit
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-900">Flu Vaccine</span>
            <span className="inline-flex items-center justify-center gap-1 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 py-0.5 rounded-md">
              <Check className="h-3 w-3 stroke-[3]" /> Oct 2026
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-900">Dental Check</span>
            <span className="inline-flex items-center justify-center gap-1 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 py-0.5 rounded-md">
              <Check className="h-3 w-3 stroke-[3]" /> Sept 2026
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-900">Pneumococcal</span>
            <span className="inline-flex items-center justify-center gap-1 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 py-0.5 rounded-md">
              <Check className="h-3 w-3 stroke-[3]" /> Verified
            </span>
          </div>
        </div>
      </section>

      {/* Quick Symptom Evaluator */}
      <section className="soft-card p-4 sm:p-5 space-y-3 bg-white border border-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
              Symptom Triage & Check
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Clinical AI</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Type symptom (e.g. dizziness, dry mouth, foot tingling)..."
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleEvaluateSymptom(symptomInput);
              }
            }}
            className="h-9 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={() => handleEvaluateSymptom(symptomInput)}
            className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Check Symptom
          </button>
        </div>

        {/* Quick Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-medium text-slate-600 hide-scrollbar pt-0.5">
          <span className="text-slate-400 font-bold shrink-0">Suggestions:</span>
          {[
            "Mild Dizziness upon Standing",
            "Increased Thirst",
            "Occasional Foot Tingling",
            "Afternoon Fatigue",
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setSymptomInput(chip);
                handleEvaluateSymptom(chip);
              }}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Result Card */}
        {evalResult && (
          <div
            className={`p-3 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
              evalResult.level === "urgent"
                ? "bg-rose-50 border-rose-200 text-rose-950"
                : evalResult.level === "moderate"
                ? "bg-amber-50 border-amber-200 text-amber-950"
                : "bg-emerald-50 border-emerald-200 text-emerald-950"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {evalResult.level === "urgent" ? (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              ) : evalResult.level === "moderate" ? (
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              )}
              <span>{evalResult.symptom}</span>
              <span className="ml-auto text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/80">
                {evalResult.level}
              </span>
            </div>
            <p className="text-slate-600 leading-snug">{evalResult.assessment}</p>
            <div className="text-[11px] font-semibold text-slate-800 bg-white/90 p-2 rounded-lg border border-slate-100 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>{evalResult.action}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
