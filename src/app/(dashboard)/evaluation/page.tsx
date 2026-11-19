"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HeartPulse,
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Stethoscope,
  ChevronRight,
  Info,
  Check,
  FileCheck,
  Calendar,
  Sparkles,
  ArrowUpRight,
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
    assessment: "Possible orthostatic blood pressure fluctuation from Lisinopril or mild dehydration.",
    action: "Drink water and rise slowly. If seated BP drops below 105 mmHg, notify Dr. Wei.",
  });

  const handleEvaluateSymptom = (text: string) => {
    const q = text.toLowerCase().trim();
    if (!q) return;

    if (q.includes("chest") || q.includes("pressure") || q.includes("shortness") || q.includes("breath")) {
      setEvalResult({
        symptom: text,
        level: "urgent",
        assessment: "Potential cardiopulmonary event given your hypertension and diabetes history.",
        action: "Seek immediate emergency evaluation or call emergency services right away.",
      });
    } else if (q.includes("thirst") || q.includes("urination") || q.includes("sugar")) {
      setEvalResult({
        symptom: text,
        level: "moderate",
        assessment: "Osmotic symptom pattern typical of transient blood sugar above 160–180 mg/dL.",
        action: "Check glucose with glucometer and log the reading for Dr. Wei's Dec 8 review.",
      });
    } else if (q.includes("foot") || q.includes("numb") || q.includes("tingl")) {
      setEvalResult({
        symptom: text,
        level: "low",
        assessment: "Peripheral sensory symptom. Standard diabetic neuropathy check indicated.",
        action: "Perform daily skin check. Monofilament test scheduled for your Dec 8 visit.",
      });
    } else {
      setEvalResult({
        symptom: text,
        level: "low",
        assessment: "Evaluated against baseline chronic profile. No acute contraindication detected.",
        action: "Continue routine daily logging and discuss at your next appointment.",
      });
    }
  };

  return (
    <div className="space-y-6 pb-28 lg:pb-12 max-w-7xl mx-auto px-1 sm:px-2">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
              Health Evaluation
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              Score: 88/100
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Cardiovascular risk, renal filtration staging, and preventive health metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <span>Alerts</span>
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white px-1">
              3
            </span>
          </Link>
          <Link
            href="/assistant"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-105 transition-all"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Copilot</span>
          </Link>
        </div>
      </div>

      {/* Main Condition Score & Key Vitals Strip */}
      <section className="soft-card p-5 bg-white border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
              <div className="text-center">
                <span className="block text-2xl font-black leading-none">88</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-100">
                  Optimal
                </span>
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                <CheckCircle2 className="h-3 w-3" /> Managed Chronic Profile
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-1">
                Type 2 Diabetes & Stage 2 Hypertension
              </h2>
              <span className="text-xs text-slate-500">
                Last clinical evaluation: Quest Diagnostics · Nov 19, 2026
              </span>
            </div>
          </div>

          {/* 4 Concise Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100">
              <span className="block text-[10px] font-bold uppercase text-slate-400">HbA1c</span>
              <span className="text-sm font-extrabold text-emerald-600">6.8%</span>
              <span className="block text-[9.5px] text-slate-500 font-medium">Target &lt; 7.0%</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Blood Pressure</span>
              <span className="text-sm font-extrabold text-emerald-600">120/78</span>
              <span className="block text-[9.5px] text-slate-500 font-medium">mmHg (Normal)</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Kidney eGFR</span>
              <span className="text-sm font-extrabold text-teal-700">68</span>
              <span className="block text-[9.5px] text-slate-500 font-medium">Stage G2 Stable</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Adherence</span>
              <span className="text-sm font-extrabold text-emerald-600">100%</span>
              <span className="block text-[9.5px] text-slate-500 font-medium">4/4 Daily Meds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Risk Gauges: ASCVD & Kidney Staging */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Card 1: 10-Year ASCVD Cardiovascular Risk */}
        <section className="soft-card p-5 bg-white border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  10-Year Cardiovascular Risk
                </h3>
                <span className="text-[11px] text-slate-500">ACC/AHA ASCVD Risk Calculation</span>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              −2.1% Improved
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">6.4%</span>
              <span className="text-xs font-bold text-emerald-700">Borderline / Low Risk</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Target &lt; 7.5%</span>
          </div>

          {/* Visual Color-coded Risk Bar */}
          <div className="space-y-1">
            <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div className="h-full w-[25%] bg-emerald-400" title="Low (<5%)" />
              <div className="h-full w-[25%] bg-amber-300" title="Borderline (5–7.4%)" />
              <div className="h-full w-[25%] bg-amber-500" title="Intermediate (7.5–19.9%)" />
              <div className="h-full w-[25%] bg-rose-500" title="High (≥20%)" />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-0.5">
              <span>Low (&lt;5%)</span>
              <span className="text-slate-800 font-extrabold">Current (6.4%)</span>
              <span>High (&gt;20%)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
              Atorvastatin 20mg Active
            </span>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
              BP within guideline target (&lt;130/80)
            </span>
          </div>
        </section>

        {/* Card 2: CKD Kidney Health Staging */}
        <section className="soft-card p-5 bg-white border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Renal Filtration (CKD Staging)
                </h3>
                <span className="text-[11px] text-slate-500">KDIGO Kidney Disease Criteria</span>
              </div>
            </div>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
              Stage G2 · Stable
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">68</span>
              <span className="text-xs font-bold text-slate-500">mL/min/1.73m² (eGFR)</span>
            </div>
            <span className="text-[11px] font-bold text-teal-700">0% Annual Decline</span>
          </div>

          {/* Visual eGFR Stage Bar */}
          <div className="space-y-1">
            <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div className="h-full w-[30%] bg-emerald-500" title="Stage G1 (>90)" />
              <div className="h-full w-[35%] bg-teal-400" title="Stage G2 (60-89)" />
              <div className="h-full w-[20%] bg-amber-400" title="Stage G3 (30-59)" />
              <div className="h-full w-[15%] bg-rose-500" title="Stage G4/G5 (<30)" />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-0.5">
              <span>Severe (&lt;30)</span>
              <span className="text-slate-800 font-extrabold">Current eGFR: 68</span>
              <span>Normal (&gt;90)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
              Creatinine: 1.04 mg/dL
            </span>
            <span className="rounded-lg bg-teal-50 px-2.5 py-1 font-semibold text-teal-700">
              Microalbumin: &lt; 30 mg/g (A1 Normal)
            </span>
            <span className="rounded-lg bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">
              Avoid NSAIDs (Ibuprofen)
            </span>
          </div>
        </section>
      </div>

      {/* Concise Preventive Care Checklist */}
      <section className="soft-card p-5 bg-white border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Preventive Care & Screening Checklist
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            4 of 5 Measures Up to Date
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="block text-xs font-bold text-slate-800">Diabetic Eye Exam</span>
              <span className="text-[11px] text-slate-500">Completed Nov 14, 2026</span>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <div>
              <span className="block text-xs font-bold text-amber-950">Urine Microalbumin</span>
              <span className="text-[11px] text-amber-700">Annual kidney surveillance</span>
            </div>
            <span className="rounded-md bg-amber-200 text-amber-900 px-2 py-0.5 text-[9.5px] font-extrabold">
              Due Feb 2027
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="block text-xs font-bold text-slate-800">Comprehensive Foot Exam</span>
              <span className="text-[11px] text-slate-500">Dr. Catherine Wei</span>
            </div>
            <span className="rounded-md bg-slate-200 text-slate-800 px-2 py-0.5 text-[9.5px] font-extrabold">
              Dec 8 Visit
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="block text-xs font-bold text-slate-800">Influenza Vaccine</span>
              <span className="text-[11px] text-slate-500">Administered Oct 2026</span>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="block text-xs font-bold text-slate-800">Dental Cleaning</span>
              <span className="text-[11px] text-slate-500">Completed Sept 2026</span>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="block text-xs font-bold text-slate-800">Pneumococcal (PCV20)</span>
              <span className="text-[11px] text-slate-500">Registry verified</span>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </span>
          </div>
        </div>
      </section>

      {/* Clean Interactive Symptom Triage */}
      <section className="soft-card p-5 bg-white border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Quick Symptom & Variance Evaluator
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Instant Clinical Triage
          </span>
        </div>

        {/* Compact input and chips */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Describe a symptom (e.g., dizziness upon standing, leg swelling, thirst)..."
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleEvaluateSymptom(symptomInput);
                }
              }}
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => handleEvaluateSymptom(symptomInput)}
              className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Evaluate
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] hide-scrollbar pt-0.5">
            <span className="text-[10px] text-slate-400 font-bold shrink-0">Suggestions:</span>
            {[
              "Mild Dizziness upon Standing",
              "Increased Thirst & Dry Mouth",
              "Foot Tingling",
              "Afternoon Fatigue",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setSymptomInput(chip);
                  handleEvaluateSymptom(chip);
                }}
                className="whitespace-nowrap px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10.5px] font-medium"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Output Card */}
        {evalResult && (
          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              evalResult.level === "urgent"
                ? "bg-rose-50/80 border-rose-200"
                : evalResult.level === "moderate"
                ? "bg-amber-50/80 border-amber-200"
                : "bg-emerald-50/80 border-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900">
                {evalResult.symptom}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  evalResult.level === "urgent"
                    ? "bg-rose-600 text-white"
                    : evalResult.level === "moderate"
                    ? "bg-amber-200 text-amber-900"
                    : "bg-emerald-200 text-emerald-900"
                }`}
              >
                {evalResult.level === "urgent"
                  ? "Urgent Care"
                  : evalResult.level === "moderate"
                  ? "Self-Monitoring"
                  : "Low Concern"}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-normal">
              {evalResult.assessment}
            </p>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs font-medium text-slate-800 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>{evalResult.action}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
