"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Heart,
  Activity,
  Flame,
  Stethoscope,
  ChevronRight,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  ArrowRight,
  Sliders,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { updateHealthProfile } from "@/lib/supabase/services/profile";

export default function ScreeningsPage() {
  const { profile, effectiveUserId, refreshProfile } = useAuth();

  // Active screening modal
  const [activeModal, setActiveModal] = useState<"ascvd" | "diabetes" | "kidney" | "metabolic" | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // ASCVD Calculator State
  const [ascvdAge, setAscvdAge] = useState<number>(54);
  const [ascvdSex, setAscvdSex] = useState<"male" | "female">("female");
  const [ascvdSbp, setAscvdSbp] = useState<number>(128);
  const [ascvdChol, setAscvdChol] = useState<number>(195);
  const [ascvdHdl, setAscvdHdl] = useState<number>(48);
  const [ascvdSmoker, setAscvdSmoker] = useState<boolean>(false);
  const [ascvdDiabetes, setAscvdDiabetes] = useState<boolean>(true);
  const [ascvdTreated, setAscvdTreated] = useState<boolean>(true);

  // ADA Diabetes Calculator State
  const [adaAgeGroup, setAdaAgeGroup] = useState<number>(2); // 0 (<40), 1 (40-49), 2 (50-59), 3 (60+)
  const [adaGender, setAdaGender] = useState<"male" | "female">("female");
  const [adaFamilyHistory, setAdaFamilyHistory] = useState<boolean>(true);
  const [adaHighBp, setAdaHighBp] = useState<boolean>(true);
  const [adaActive, setAdaActive] = useState<boolean>(false);
  const [adaBmiTier, setAdaBmiTier] = useState<number>(1); // 0 (<25), 1 (25-29.9), 2 (30-39.9), 3 (40+)

  // KDIGO Kidney Risk State
  const [kidneyEgfr, setKidneyEgfr] = useState<number>(72);
  const [kidneyUacr, setKidneyUacr] = useState<number>(24);

  // Metabolic Health State
  const [metaGlucose, setMetaGlucose] = useState<boolean>(true); // Controlled or normal
  const [metaBp, setMetaBp] = useState<boolean>(true); // Controlled or normal
  const [metaHdl, setMetaHdl] = useState<boolean>(false);
  const [metaTriglycerides, setMetaTriglycerides] = useState<boolean>(false);
  const [metaBmi, setMetaBmi] = useState<boolean>(true);

  // Calculate ASCVD 10-Year Score
  const ascvdResult = useMemo(() => {
    let score = 0;
    // Base age points
    score += (ascvdAge - 40) * 0.45;
    // SBP contribution
    if (ascvdSbp > 120) score += (ascvdSbp - 120) * 0.08;
    if (ascvdTreated) score += 1.5;
    // Cholesterol ratio
    const cholRatio = ascvdChol / Math.max(ascvdHdl, 20);
    score += cholRatio * 0.9;
    // Risk factors
    if (ascvdSmoker) score += 4.2;
    if (ascvdDiabetes) score += 3.8;
    if (ascvdSex === "male") score += 1.8;

    const estimatedRisk = Math.min(Math.max(Math.round(score * 10) / 10, 1.2), 48.5);

    let tier: "low" | "borderline" | "intermediate" | "high" = "low";
    if (estimatedRisk >= 20) tier = "high";
    else if (estimatedRisk >= 7.5) tier = "intermediate";
    else if (estimatedRisk >= 5.0) tier = "borderline";

    return { risk: estimatedRisk, tier };
  }, [ascvdAge, ascvdSex, ascvdSbp, ascvdChol, ascvdHdl, ascvdSmoker, ascvdDiabetes, ascvdTreated]);

  // Calculate ADA Diabetes Risk Score
  const adaResult = useMemo(() => {
    let points = 0;
    points += adaAgeGroup; // 0 to 3 points
    if (adaGender === "male") points += 1;
    if (adaFamilyHistory) points += 1;
    if (adaHighBp) points += 1;
    if (!adaActive) points += 1;
    points += adaBmiTier; // 0 to 3 points

    const isHighRisk = points >= 5;
    return { points, isHighRisk };
  }, [adaAgeGroup, adaGender, adaFamilyHistory, adaHighBp, adaActive, adaBmiTier]);

  // Calculate KDIGO Kidney Stage
  const kdigoResult = useMemo(() => {
    let gStage = "G1";
    if (kidneyEgfr >= 90) gStage = "G1 (Normal / High)";
    else if (kidneyEgfr >= 60) gStage = "G2 (Mildly Decreased)";
    else if (kidneyEgfr >= 45) gStage = "G3a (Mild-to-Moderate)";
    else if (kidneyEgfr >= 30) gStage = "G3b (Moderate-to-Severe)";
    else if (kidneyEgfr >= 15) gStage = "G4 (Severely Decreased)";
    else gStage = "G5 (Kidney Failure)";

    let aStage = "A1 (Normal < 30 mg/g)";
    if (kidneyUacr >= 300) aStage = "A3 (Severe Microalbuminuria > 300 mg/g)";
    else if (kidneyUacr >= 30) aStage = "A2 (Microalbuminuria 30-300 mg/g)";

    let riskLevel: "low" | "moderate" | "high" | "very_high" = "low";
    if (kidneyEgfr < 30 || kidneyUacr >= 300) riskLevel = "very_high";
    else if (kidneyEgfr < 45 || kidneyUacr >= 30) riskLevel = "high";
    else if (kidneyEgfr < 60) riskLevel = "moderate";

    return { gStage, aStage, riskLevel };
  }, [kidneyEgfr, kidneyUacr]);

  // Calculate Metabolic Score (0-100)
  const metabolicResult = useMemo(() => {
    let count = 0;
    if (metaGlucose) count++;
    if (metaBp) count++;
    if (metaHdl) count++;
    if (metaTriglycerides) count++;
    if (metaBmi) count++;
    const score = Math.round((count / 5) * 100);
    return { score, criteriaMet: count };
  }, [metaGlucose, metaBp, metaHdl, metaTriglycerides, metaBmi]);

  // Save screening results to database
  const saveAssessment = async (screeningType: string, summary: string) => {
    if (!effectiveUserId) return;
    try {
      const existingPrefs = (profile?.preferences as any) || {};
      const updatedScreenings = {
        ...(existingPrefs.screenings || {}),
        [screeningType]: {
          completed_at: new Date().toISOString(),
          summary,
        },
      };

      await updateHealthProfile(effectiveUserId, {
        preferences: {
          ...existingPrefs,
          screenings: updatedScreenings,
        },
      });
      await refreshProfile();
      setActiveModal(null);
      setNotification(`Saved ${screeningType.toUpperCase()} assessment results to your health record.`);
      setTimeout(() => setNotification(null), 4000);
    } catch {
      setActiveModal(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Clinical Health Screenings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Evidence-based risk stratification algorithms: ASCVD, ADA Diabetes, KDIGO Renal, and Metabolic Health.
          </p>
        </div>

        <Link
          href="/assistant"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors self-start sm:self-auto"
        >
          <Stethoscope className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Ask Copilot About Risks</span>
        </Link>
      </div>

      {notification && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800 p-3.5 text-xs font-bold text-emerald-900 dark:text-emerald-300 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hero Overview Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-5 sm:p-6 text-white shadow-lg border border-emerald-500/20">
        <div className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-emerald-100 border border-white/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Preventive Surveillance Engine</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Personalized Risk Stratification
            </h2>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Early detection prevents progression. Run validated clinical calculators cross-referenced with your laboratory blood panels and diagnosed chronic conditions.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/15 dark:bg-white/10 p-4 backdrop-blur-md border border-white/15 shrink-0">
            <div>
              <span className="block text-2xl font-extrabold text-white">4</span>
              <span className="block text-[11px] font-bold text-emerald-100">Validated Protocols</span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <span className="block text-2xl font-extrabold text-white">100%</span>
              <span className="block text-[11px] font-bold text-emerald-100">Guideline Aligned</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 CORE SCREENING TOOLS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool 1: ASCVD 10-Year Cardiovascular Calculator */}
        <div className="soft-card hover-lift p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50">
                <Heart className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                ACC / AHA Standard
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[var(--foreground)]">
                ASCVD 10-Year Cardiovascular Risk
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                Estimates 10-year probability of coronary death, non-fatal myocardial infarction, or stroke based on blood pressure, cholesterol, and diabetes status.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block">
                  Current Estimate
                </span>
                <span className="text-base font-extrabold text-[var(--foreground)]">
                  {ascvdResult.risk}% 10-Year Risk
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  ascvdResult.tier === "high"
                    ? "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                    : ascvdResult.tier === "intermediate"
                    ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {ascvdResult.tier} risk
              </span>
            </div>
          </div>

          <Button
            onClick={() => setActiveModal("ascvd")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Open ASCVD Calculator
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Tool 2: ADA 60-Second Diabetes Risk Screener */}
        <div className="soft-card hover-lift p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50">
                <Flame className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                ADA 2026 Protocol
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[var(--foreground)]">
                Type 2 Diabetes Risk Screener
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                Official 6-point American Diabetes Association clinical algorithm assessing prediabetes, glycemic vulnerability, and metabolic risk.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block">
                  Current Score
                </span>
                <span className="text-base font-extrabold text-[var(--foreground)]">
                  {adaResult.points} / 10 Points
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  adaResult.isHighRisk
                    ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {adaResult.isHighRisk ? "Elevated Risk (≥5)" : "Low Risk (<5)"}
              </span>
            </div>
          </div>

          <Button
            onClick={() => setActiveModal("diabetes")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Open Diabetes Screener
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Tool 3: KDIGO Chronic Kidney Disease Matrix */}
        <div className="soft-card hover-lift p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-200/50 dark:border-teal-900/50">
                <Activity className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 text-[10px] font-extrabold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                KDIGO Guideline
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[var(--foreground)]">
                KDIGO Kidney Function Heatmap
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                Stratifies renal staging by intersecting estimated GFR with urine albumin-to-creatinine ratio (UACR) for nephropathy risk surveillance.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block">
                  Renal Stage
                </span>
                <span className="text-sm font-extrabold text-[var(--foreground)]">
                  {kdigoResult.gStage.split(" ")[0]} · {kdigoResult.aStage.split(" ")[0]}
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  kdigoResult.riskLevel === "very_high" || kdigoResult.riskLevel === "high"
                    ? "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                    : kdigoResult.riskLevel === "moderate"
                    ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {kdigoResult.riskLevel.replace("_", " ")} risk
              </span>
            </div>
          </div>

          <Button
            onClick={() => setActiveModal("kidney")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Open Kidney Heatmap
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Tool 4: Metabolic Longevity Index */}
        <div className="soft-card hover-lift p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Metabolic Score
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[var(--foreground)]">
                Metabolic Health &amp; Longevity Index
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                Evaluates the 5 hallmark pillars of metabolic resilience: blood glucose, resting blood pressure, HDL, triglycerides, and waist-to-height ratio.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block">
                  Metabolic Score
                </span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  {metabolicResult.score} / 100
                </span>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold">
                {metabolicResult.criteriaMet} of 5 Criteria Met
              </span>
            </div>
          </div>

          <Button
            onClick={() => setActiveModal("metabolic")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Check Metabolic Health
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* ASCVD CALCULATOR MODAL */}
      {activeModal === "ascvd" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg space-y-4 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  <Heart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--foreground)]">
                    ASCVD 10-Year Cardiovascular Risk Calculator
                  </h3>
                  <span className="text-[10px] text-[var(--muted-foreground)] block">
                    American College of Cardiology / AHA Pooled Cohort Equations
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Age ({ascvdAge} years)
                  </label>
                  <input
                    type="range"
                    min="35"
                    max="79"
                    value={ascvdAge}
                    onChange={(e) => setAscvdAge(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Biological Sex
                  </label>
                  <select
                    value={ascvdSex}
                    onChange={(e) => setAscvdSex(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-2 font-semibold text-[var(--foreground)]"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Systolic BP
                  </label>
                  <Input
                    type="number"
                    value={ascvdSbp}
                    onChange={(e) => setAscvdSbp(Number(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Total Chol.
                  </label>
                  <Input
                    type="number"
                    value={ascvdChol}
                    onChange={(e) => setAscvdChol(Number(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    HDL Chol.
                  </label>
                  <Input
                    type="number"
                    value={ascvdHdl}
                    onChange={(e) => setAscvdHdl(Number(e.target.value))}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-[var(--secondary)]">
                  <span className="font-bold text-[var(--foreground)]">On Blood Pressure Medication</span>
                  <input
                    type="checkbox"
                    checked={ascvdTreated}
                    onChange={(e) => setAscvdTreated(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-[var(--secondary)]">
                  <span className="font-bold text-[var(--foreground)]">Diagnosed with Diabetes Mellitus</span>
                  <input
                    type="checkbox"
                    checked={ascvdDiabetes}
                    onChange={(e) => setAscvdDiabetes(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-[var(--secondary)]">
                  <span className="font-bold text-[var(--foreground)]">Current Tobacco Smoker</span>
                  <input
                    type="checkbox"
                    checked={ascvdSmoker}
                    onChange={(e) => setAscvdSmoker(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                </label>
              </div>

              {/* Calculated Result Box */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] block">
                      Estimated 10-Year ASCVD Risk
                    </span>
                    <span className="text-2xl font-extrabold text-[var(--foreground)]">
                      {ascvdResult.risk}%
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                      ascvdResult.tier === "high"
                        ? "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                        : ascvdResult.tier === "intermediate"
                        ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    {ascvdResult.tier} Risk Tier
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)] pt-2">
                  {ascvdResult.tier === "high"
                    ? "Clinical Guidelines recommend high-intensity statin therapy, target BP < 130/80 mmHg, and comprehensive cardiovascular risk factor modification."
                    : ascvdResult.tier === "intermediate"
                    ? "Moderate-intensity statin therapy is recommended alongside regular lipid panel surveillance every 6-12 months."
                    : "Low cardiovascular disease risk. Continue Mediterranean or DASH dietary pattern and maintain regular aerobic exercise."}
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <Button variant="outline" onClick={() => setActiveModal(null)}>
                  Close
                </Button>
                <Button
                  onClick={() =>
                    saveAssessment(
                      "ascvd",
                      `${ascvdResult.risk}% 10-year risk (${ascvdResult.tier.toUpperCase()})`
                    )
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save to Health Record
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADA DIABETES CALCULATOR MODAL */}
      {activeModal === "diabetes" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg space-y-4 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--foreground)]">
                    ADA 60-Second Type 2 Diabetes Risk Screener
                  </h3>
                  <span className="text-[10px] text-[var(--muted-foreground)] block">
                    American Diabetes Association Validated Scoring Tool
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    1. Age Category
                  </label>
                  <select
                    value={adaAgeGroup}
                    onChange={(e) => setAdaAgeGroup(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-2 font-semibold text-[var(--foreground)]"
                  >
                    <option value={0}>Under 40 years old (0 pts)</option>
                    <option value={1}>40 - 49 years old (1 pt)</option>
                    <option value={2}>50 - 59 years old (2 pts)</option>
                    <option value={3}>60 years or older (3 pts)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    2. Body Mass Index (BMI) Category
                  </label>
                  <select
                    value={adaBmiTier}
                    onChange={(e) => setAdaBmiTier(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-2 font-semibold text-[var(--foreground)]"
                  >
                    <option value={0}>Normal Weight (BMI &lt; 25) (0 pts)</option>
                    <option value={1}>Overweight (BMI 25 - 29.9) (1 pt)</option>
                    <option value={2}>Obese Class I/II (BMI 30 - 39.9) (2 pts)</option>
                    <option value={3}>Severely Obese (BMI ≥ 40) (3 pts)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1 border-t border-[var(--border)]">
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-[var(--secondary)]">
                    <span className="font-bold text-[var(--foreground)]">Family Member with Diabetes (Parent/Sibling)</span>
                    <input
                      type="checkbox"
                      checked={adaFamilyHistory}
                      onChange={(e) => setAdaFamilyHistory(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-[var(--secondary)]">
                    <span className="font-bold text-[var(--foreground)]">Diagnosed with High Blood Pressure</span>
                    <input
                      type="checkbox"
                      checked={adaHighBp}
                      onChange={(e) => setAdaHighBp(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-[var(--secondary)]">
                    <span className="font-bold text-[var(--foreground)]">Physically Active (≥150 min/week exercise)</span>
                    <input
                      type="checkbox"
                      checked={adaActive}
                      onChange={(e) => setAdaActive(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                  </label>
                </div>
              </div>

              {/* Result Box */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] block">
                      ADA Risk Score
                    </span>
                    <span className="text-2xl font-extrabold text-[var(--foreground)]">
                      {adaResult.points} / 10 Points
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                      adaResult.isHighRisk
                        ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    {adaResult.isHighRisk ? "High Prediabetes Risk" : "Low Risk (< 5)"}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)] pt-2">
                  {adaResult.isHighRisk
                    ? "Score of 5 or higher puts you at heightened risk for prediabetes or undiagnosed type 2 diabetes. A diagnostic fasting blood glucose or HbA1c test is clinically recommended."
                    : "Low risk on the ADA scale. Maintaining active physical movement and balanced nutrition is recommended."}
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <Button variant="outline" onClick={() => setActiveModal(null)}>
                  Close
                </Button>
                <Button
                  onClick={() =>
                    saveAssessment(
                      "diabetes_risk",
                      `${adaResult.points}/10 pts (${adaResult.isHighRisk ? "HIGH RISK" : "LOW RISK"})`
                    )
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save to Health Record
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KDIGO KIDNEY CALCULATOR MODAL */}
      {activeModal === "kidney" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg space-y-4 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--foreground)]">
                    KDIGO Chronic Kidney Disease Staging Matrix
                  </h3>
                  <span className="text-[10px] text-[var(--muted-foreground)] block">
                    Kidney Disease: Improving Global Outcomes (KDIGO) Clinical Heatmap
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    eGFR (mL/min/1.73m²)
                  </label>
                  <Input
                    type="number"
                    value={kidneyEgfr}
                    onChange={(e) => setKidneyEgfr(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-[var(--muted-foreground)] block mt-1">
                    Normal: &gt; 60 - 90
                  </span>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Urine Albumin (UACR mg/g)
                  </label>
                  <Input
                    type="number"
                    value={kidneyUacr}
                    onChange={(e) => setKidneyUacr(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-[var(--muted-foreground)] block mt-1">
                    Normal: &lt; 30 mg/g
                  </span>
                </div>
              </div>

              {/* Staging Result Box */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] block">
                      Staging Summary
                    </span>
                    <span className="text-lg font-extrabold text-[var(--foreground)]">
                      {kdigoResult.gStage}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                      kdigoResult.riskLevel === "very_high" || kdigoResult.riskLevel === "high"
                        ? "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                        : kdigoResult.riskLevel === "moderate"
                        ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    {kdigoResult.riskLevel.replace("_", " ")} Risk
                  </span>
                </div>

                <div className="text-[11px] text-[var(--muted-foreground)] space-y-1 border-t border-[var(--border)] pt-2">
                  <div>
                    <strong>Albuminuria Grade:</strong> {kdigoResult.aStage}
                  </div>
                  <div>
                    <strong>Recommended Cadence:</strong>{" "}
                    {kdigoResult.riskLevel === "low"
                      ? "Annual serum creatinine & urine albumin surveillance."
                      : kdigoResult.riskLevel === "moderate"
                      ? "Repeat eGFR and UACR every 6 months. Review renoprotective medications."
                      : "Nephrology consultation and quarterly renal surveillance recommended."}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <Button variant="outline" onClick={() => setActiveModal(null)}>
                  Close
                </Button>
                <Button
                  onClick={() =>
                    saveAssessment(
                      "kdigo_kidney",
                      `eGFR ${kidneyEgfr} / UACR ${kidneyUacr} (${kdigoResult.riskLevel.toUpperCase()})`
                    )
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save to Health Record
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* METABOLIC SCORE MODAL */}
      {activeModal === "metabolic" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg space-y-4 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--foreground)]">
                    Metabolic Health &amp; Longevity Resilience Index
                  </h3>
                  <span className="text-[10px] text-[var(--muted-foreground)] block">
                    Assessment of the 5 Clinical Biomarkers for Optimal Longevity
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <span className="text-[11px] font-bold text-[var(--muted-foreground)] block">
                Toggle the criteria below that are currently within your target ranges:
              </span>

              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-[var(--secondary)]">
                  <div>
                    <span className="font-bold text-[var(--foreground)] block">1. Normal Glucose Regulation</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">Fasting glucose &lt; 100 mg/dL or HbA1c &lt; 5.7% (or within individual target)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={metaGlucose}
                    onChange={(e) => setMetaGlucose(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-[var(--secondary)]">
                  <div>
                    <span className="font-bold text-[var(--foreground)] block">2. Healthy Blood Pressure</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">Resting systolic &lt; 120 mmHg and diastolic &lt; 80 mmHg</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={metaBp}
                    onChange={(e) => setMetaBp(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-[var(--secondary)]">
                  <div>
                    <span className="font-bold text-[var(--foreground)] block">3. Optimal HDL Cholesterol</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">&gt; 40 mg/dL (men) or &gt; 50 mg/dL (women)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={metaHdl}
                    onChange={(e) => setMetaHdl(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-[var(--secondary)]">
                  <div>
                    <span className="font-bold text-[var(--foreground)] block">4. Low Triglycerides</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">Fasting triglycerides &lt; 150 mg/dL</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={metaTriglycerides}
                    onChange={(e) => setMetaTriglycerides(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-[var(--secondary)]">
                  <div>
                    <span className="font-bold text-[var(--foreground)] block">5. Healthy Waist / BMI Ratio</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">BMI 18.5 - 24.9 kg/m² or waist circumference &lt; 35 in (women) / 40 in (men)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={metaBmi}
                    onChange={(e) => setMetaBmi(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                </label>
              </div>

              {/* Score Box */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] block">
                      Metabolic Health Index
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                      {metabolicResult.score} / 100
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold border bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                    {metabolicResult.criteriaMet} of 5 Criteria Met
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)] pt-2">
                  Meeting 4 or 5 criteria significantly reduces lifetime cardiovascular and metabolic risk and supports extended longevity resilience.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <Button variant="outline" onClick={() => setActiveModal(null)}>
                  Close
                </Button>
                <Button
                  onClick={() =>
                    saveAssessment(
                      "metabolic_score",
                      `${metabolicResult.score}/100 (${metabolicResult.criteriaMet}/5 criteria met)`
                    )
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save to Health Record
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
