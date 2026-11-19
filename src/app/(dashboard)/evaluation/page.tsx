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
  TrendingUp,
  Stethoscope,
  Calendar,
  Sparkles,
  ChevronRight,
  Info,
  ArrowRight,
  Check,
  Eye,
  FileCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export default function HealthEvaluationPage() {
  const [symptomInput, setSymptomInput] = useState("");
  const [evalResult, setEvalResult] = useState<{
    symptom: string;
    level: "low" | "moderate" | "urgent";
    assessment: string;
    recommendation: string;
  } | null>({
    symptom: "Mild Dizziness upon Standing",
    level: "moderate",
    assessment: "Possible orthostatic blood pressure fluctuation secondary to Lisinopril 20mg or mild dehydration.",
    recommendation: "Drink 1 glass of water before rising slowly. If seated systolic blood pressure falls below 105 mmHg, contact Dr. Catherine Wei's office.",
  });

  const handleEvaluateSymptom = (text: string) => {
    const q = text.toLowerCase().trim();
    if (!q) return;

    if (q.includes("chest") || q.includes("pressure") || q.includes("shortness of breath") || q.includes("breath")) {
      setEvalResult({
        symptom: text,
        level: "urgent",
        assessment: "Cardiovascular or pulmonary concern. With a history of hypertension and Type 2 Diabetes, acute chest symptoms or shortness of breath require immediate clinical evaluation.",
        recommendation: "Please seek urgent medical care or emergency evaluation immediately if accompanied by diaphoresis, radiating discomfort, or lightheadedness.",
      });
    } else if (q.includes("thirst") || q.includes("urination") || q.includes("sugar")) {
      setEvalResult({
        symptom: text,
        level: "moderate",
        assessment: "Osmotic symptoms commonly seen during transient blood glucose excursions above 160–180 mg/dL.",
        recommendation: "Check fasting and postprandial glucose with your glucometer. Log the reading in ChronicAI and discuss with Dr. Wei on Dec 8 if persistent.",
      });
    } else if (q.includes("foot") || q.includes("numb") || q.includes("tingl")) {
      setEvalResult({
        symptom: text,
        level: "low",
        assessment: "Peripheral sensory checkpoint. Early diabetic neuropathy monitoring is standard for Elena's profile.",
        recommendation: "Perform daily visual foot skin checks. Dr. Wei will conduct a monofilament test at your upcoming consultation on December 8.",
      });
    } else {
      setEvalResult({
        symptom: text,
        level: "low",
        assessment: `Symptom evaluated against Elena's baseline profile (Type 2 Diabetes, HTN, CKD Stage 2). No direct acute contraindication detected.`,
        recommendation: "Continue regular biometric tracking and discuss during your next routine primary care appointment.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Page Header */}
      <PageHeader
        eyebrow="Clinical Intelligence"
        title="Health Evaluation & Risk Assessment"
        description="Comprehensive appraisal of Elena Vance's chronic conditions, 10-year cardiovascular risk, and preventive care quality metrics."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
            >
              <span>View Care Alerts</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                3
              </span>
            </Link>
            <Link
              href="/assistant"
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Discuss with Copilot</span>
            </Link>
          </div>
        }
      />

      {/* Main Condition Score & Status Hero (Image 1 / Apple Health Style) */}
      <section className="soft-card relative overflow-hidden p-5 sm:p-6 bg-white border border-slate-200/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-600/30">
              <div className="text-center">
                <span className="block text-2xl font-extrabold leading-none">88</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                  / 100
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
                  Optimal Management
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Updated Nov 19, 2026
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mt-1 leading-tight">
                Comprehensive Clinical Health Evaluation
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Elena's dual chronic profile (Type 2 Diabetes & Stage 2 Hypertension) demonstrates sustained stabilization under current ACE inhibitor and biguanide therapy.
              </p>
            </div>
          </div>

          {/* Core Condition Metric Mini-Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Glycemic (A1c)
              </span>
              <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                6.8% (Target)
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Blood Pressure
              </span>
              <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                120/78 mmHg
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Kidney (eGFR)
              </span>
              <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                68 mL/min
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Adherence
              </span>
              <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                100% (4/4 meds)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: ASCVD Cardiovascular Risk & CKD Longitudinal Staging */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Card 1: 10-Year ASCVD Cardiovascular Risk Score */}
        <section className="soft-card p-5 sm:p-6 space-y-4 border border-slate-200/90 bg-white">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <HeartPulse className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  10-Year ASCVD Cardiovascular Risk
                </h3>
                <span className="text-[11px] text-slate-500">
                  ACC/AHA Guideline-based Pooled Cohort Equation
                </span>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
              Down −2.1%
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900">6.4%</span>
                <span className="text-xs font-bold text-slate-500">Borderline / Low</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                Reduced from 8.5% prior to Atorvastatin 20mg therapy
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              Target: &lt; 7.5%
            </span>
          </div>

          {/* Visual Risk Gauge */}
          <div className="space-y-1.5 pt-1">
            <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div className="h-full w-1/4 bg-emerald-400" title="Low (<5%)" />
              <div className="h-full w-1/4 bg-yellow-400" title="Borderline (5–7.4%)" />
              <div className="h-full w-1/4 bg-amber-400" title="Intermediate (7.5–19.9%)" />
              <div className="h-full w-1/4 bg-rose-500" title="High (≥20%)" />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>Low (&lt;5%)</span>
              <span className="text-slate-800 font-extrabold">Elena (6.4%)</span>
              <span>Intermediate</span>
              <span>High (&gt;20%)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <span className="font-extrabold block text-slate-900">Clinical Impact Assessment:</span>
            <p className="leading-relaxed">
              Achieving an HbA1c of 6.8% and maintaining systolic blood pressure under 130 mmHg keeps cardiovascular event probability within optimal bounds.
            </p>
          </div>
        </section>

        {/* Card 2: Diabetic Kidney Disease (CKD) Longitudinal Staging */}
        <section className="soft-card p-5 sm:p-6 space-y-4 border border-slate-200/90 bg-white">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Activity className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Renal Filtration & CKD Evaluation
                </h3>
                <span className="text-[11px] text-slate-500">
                  KDIGO Chronic Kidney Disease Staging
                </span>
              </div>
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-extrabold text-teal-800 border border-teal-200">
              Stage G2 · Stable
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900">68</span>
                <span className="text-xs font-bold text-slate-500">mL/min/1.73m² (eGFR)</span>
              </div>
              <span className="text-[11px] text-slate-600 font-semibold mt-0.5 block">
                Serum Creatinine: 1.04 mg/dL · Mild reduction with zero annual decline
              </span>
            </div>
            <span className="text-[10px] text-teal-700 font-bold uppercase">
              Stable trajectory
            </span>
          </div>

          {/* Kidney Health Points */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">Renoprotective Therapy</span>
              <span className="font-extrabold text-emerald-700">Lisinopril 20mg Active</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">Microalbumin/Creatinine Ratio</span>
              <span className="font-extrabold text-slate-900">&lt; 30 mg/g (Normal A1)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">NSAID Nephrotoxicity Safety</span>
              <span className="font-extrabold text-rose-600">Strictly Avoid Ibuprofen</span>
            </div>
          </div>
        </section>
      </div>

      {/* Preventive Care Checklist & Quality Gaps */}
      <section className="soft-card p-5 sm:p-6 space-y-4 border border-slate-200/90 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                Preventive Care & Quality Measures Checklist
              </h3>
              <span className="text-[11px] text-slate-500">
                Annual diabetic health screening and preventive quality metrics
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            4 of 5 Measures Met
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Diabetic Eye Exam</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Valley Eye Center (Nov 14, 2026). Normal fundoscopic examination with zero retinopathy.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">Urine Microalbumin</span>
              <span className="rounded-lg bg-amber-200 text-amber-900 px-2 py-0.5 text-[9px] font-extrabold">
                Due Feb 2027
              </span>
            </div>
            <p className="text-[11px] text-amber-900/80">
              Annual albuminuria screening required to maintain KDIGO nephropathy surveillance.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Comprehensive Foot Exam</span>
              <span className="rounded-lg bg-slate-200 text-slate-800 px-2 py-0.5 text-[9px] font-extrabold">
                Dec 8 Visit
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Scheduled with Dr. Catherine Wei during upcoming endocrine appointment.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Influenza Vaccine</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Administered Oct 2026 at Metro Health Center.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Dental & Periodontal</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Smile Labs cleaning completed Sept 2026.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Pneumococcal Vaccine</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              PCV20 verified on immunization registry (2025).
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Symptom & Acute Variance Evaluator */}
      <section className="soft-card p-5 sm:p-6 space-y-4 border border-slate-200/90 bg-white">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-600/20">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                Self-Assessment & Symptom Evaluator
              </h3>
              <span className="text-[11px] text-slate-500">
                Instant clinical appraisal grounded in Elena Vance's health profile
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">
            AI Clinical Triage
          </span>
        </div>

        {/* Evaluation Input */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Describe any symptom or feeling (e.g., dizziness when standing, leg swelling, headache)..."
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleEvaluateSymptom(symptomInput);
                }
              }}
              className="h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => handleEvaluateSymptom(symptomInput)}
              className="flex h-11 shrink-0 items-center justify-center gap-1.5 px-5 rounded-2xl bg-[#18261F] text-white text-xs font-bold shadow-sm hover:bg-[#253D30] transition-colors cursor-pointer"
            >
              <span>Evaluate Symptom</span>
            </button>
          </div>

          {/* Quick chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-600 max-w-full hide-scrollbar pt-1">
            <span className="text-[10px] text-slate-400 font-bold shrink-0">Try evaluating:</span>
            {[
              "Mild Dizziness upon Standing",
              "Increased Thirst & Dry Mouth",
              "Occasional Foot Tingling",
              "Mild Afternoon Fatigue",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setSymptomInput(chip);
                  handleEvaluateSymptom(chip);
                }}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Evaluation Output Card */}
        {evalResult && (
          <div
            className={`p-4 rounded-2xl border space-y-2.5 animate-in fade-in ${
              evalResult.level === "urgent"
                ? "bg-rose-50/80 border-rose-200 text-rose-950"
                : evalResult.level === "moderate"
                ? "bg-amber-50/80 border-amber-200 text-amber-950"
                : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {evalResult.level === "urgent" ? (
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                ) : evalResult.level === "moderate" ? (
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                )}
                <span className="text-xs font-extrabold">
                  {evalResult.symptom}:{" "}
                  {evalResult.level === "urgent"
                    ? "Urgent Clinical Attention Recommended"
                    : evalResult.level === "moderate"
                    ? "Non-Urgent / Self-Monitoring Advised"
                    : "Low Clinical Concern"}
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-700">
              {evalResult.assessment}
            </p>

            <div className="p-3 rounded-xl bg-white/95 border border-slate-200/60 text-xs font-semibold text-slate-800 flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{evalResult.recommendation}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
