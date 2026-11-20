"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Pill,
  Stethoscope,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  Calendar,
  Activity,
  Heart,
  FileText,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Medication, Condition } from "@/types/medical";
import { getMedications } from "@/lib/supabase/services/medications";
import { updateHealthProfile } from "@/lib/supabase/services/profile";
import { useRealtimeTable } from "@/hooks/useRealtime";

// Common Chronic Condition Clinical Presets
const CONDITION_PRESETS = [
  {
    name: "Type 2 Diabetes Mellitus",
    icd10: "E11.9",
    category: "Metabolic",
    defaultNotes: "Maintain glycemic control with target HbA1c < 7.0% and daily fasting glucose 80-130 mg/dL.",
    targetBiomarker: "HbA1c < 7.0%",
  },
  {
    name: "Essential Hypertension",
    icd10: "I10",
    category: "Cardiovascular",
    defaultNotes: "Maintain resting blood pressure < 130/80 mmHg. Low sodium diet (<2,000 mg/day).",
    targetBiomarker: "BP < 130/80 mmHg",
  },
  {
    name: "Hyperlipidemia (High Cholesterol)",
    icd10: "E78.5",
    category: "Lipids",
    defaultNotes: "Target LDL cholesterol < 70 mg/dL and non-HDL < 100 mg/dL on lipid-lowering therapy.",
    targetBiomarker: "LDL < 70 mg/dL",
  },
  {
    name: "Chronic Kidney Disease (Stage 2/3)",
    icd10: "N18.9",
    category: "Renal",
    defaultNotes: "Monitor eGFR and urine albumin-to-creatinine ratio (UACR) every 6 months. Maintain renoprotective ACEi/ARB regimen.",
    targetBiomarker: "eGFR > 60 mL/min",
  },
  {
    name: "Asthma / Reactive Airway",
    icd10: "J45.9",
    category: "Respiratory",
    defaultNotes: "Maintain peak expiratory flow > 80% baseline. Controller inhaler daily; avoid known triggers.",
    targetBiomarker: "Peak Flow > 80%",
  },
  {
    name: "Hypothyroidism",
    icd10: "E03.9",
    category: "Endocrine",
    defaultNotes: "Levothyroxine therapy with target serum TSH between 0.5 - 2.5 mIU/L.",
    targetBiomarker: "TSH 0.5 - 2.5 mIU/L",
  },
  {
    name: "Gastroesophageal Reflux Disease (GERD)",
    icd10: "K21.9",
    category: "Gastrointestinal",
    defaultNotes: "Dietary avoidance of acidic/spicy foods. Elevation of head during sleep; PPI/H2RA as needed.",
    targetBiomarker: "Symptom Control",
  },
];

export default function ChronicCarePage() {
  const { effectiveUserId, profile, refreshProfile } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form state for adding/editing condition
  const [condName, setCondName] = useState("");
  const [icd10, setIcd10] = useState("");
  const [condStatus, setCondStatus] = useState<"active" | "managed" | "resolved">("active");
  const [diagnosedDate, setDiagnosedDate] = useState(new Date().toISOString().split("T")[0]);
  const [condNotes, setCondNotes] = useState("");

  // Normalize chronic_conditions array from profile
  const conditions: Condition[] = useMemo(() => {
    const raw = profile?.chronic_conditions;
    if (!Array.isArray(raw)) return [];
    return raw.map((item: any, idx: number) => {
      if (typeof item === "string") {
        return {
          id: `cond-${idx}-${item.toLowerCase().replace(/\s+/g, "-")}`,
          name: item,
          status: "active" as const,
          diagnosed_date: new Date().toISOString().split("T")[0],
          notes: "Active monitored condition.",
        };
      }
      return {
        id: item.id || `cond-${idx}-${Date.now()}`,
        name: item.name || "Chronic Condition",
        icd10: item.icd10 || undefined,
        status: (item.status as any) || "active",
        diagnosed_date: item.diagnosed_date || new Date().toISOString().split("T")[0],
        notes: item.notes || "",
      };
    });
  }, [profile?.chronic_conditions]);

  const loadMeds = useCallback(async () => {
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

  const handleSelectPreset = (preset: typeof CONDITION_PRESETS[0]) => {
    setCondName(preset.name);
    setIcd10(preset.icd10);
    setCondNotes(preset.defaultNotes);
  };

  // Add new condition
  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condName.trim() || !effectiveUserId) return;
    setIsSaving(true);

    try {
      const newCondition: Condition = {
        id: `cond-${Date.now()}`,
        name: condName.trim(),
        icd10: icd10.trim() || undefined,
        status: condStatus,
        diagnosed_date: diagnosedDate || new Date().toISOString().split("T")[0],
        notes: condNotes.trim() || undefined,
      };

      const updatedList = [newCondition, ...conditions];

      await updateHealthProfile(effectiveUserId, {
        chronic_conditions: updatedList,
      });
      await refreshProfile();

      setShowAddModal(false);
      setCondName("");
      setIcd10("");
      setCondStatus("active");
      setCondNotes("");
      setNotification(`Added "${newCondition.name}" to your chronic care plan.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error("Failed to add condition:", err);
      setNotification("Failed to add condition. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle or change status of a condition
  const handleUpdateStatus = async (conditionId: string, newStatus: "active" | "managed" | "resolved") => {
    if (!effectiveUserId) return;
    try {
      const updatedList = conditions.map((c) =>
        c.id === conditionId ? { ...c, status: newStatus } : c
      );
      await updateHealthProfile(effectiveUserId, {
        chronic_conditions: updatedList,
      });
      await refreshProfile();
      setNotification(`Updated condition status to ${newStatus}.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error("Failed to update condition status:", err);
    }
  };

  // Remove a condition
  const handleRemoveCondition = async (conditionId: string, conditionName: string) => {
    if (!effectiveUserId) return;
    const confirmRemove = window.confirm(`Remove "${conditionName}" from your chronic care protocols?`);
    if (!confirmRemove) return;

    try {
      const updatedList = conditions.filter((c) => c.id !== conditionId);
      await updateHealthProfile(effectiveUserId, {
        chronic_conditions: updatedList,
      });
      await refreshProfile();
      setNotification(`Removed "${conditionName}" from your chronic conditions.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error("Failed to remove condition:", err);
    }
  };

  // Derive dynamic clinical targets based on active conditions
  const hasDiabetes = conditions.some((c) => c.name.toLowerCase().includes("diabet") && c.status !== "resolved");
  const hasHypertension = conditions.some((c) => (c.name.toLowerCase().includes("hypertens") || c.name.toLowerCase().includes("blood pressure")) && c.status !== "resolved");
  const hasLipids = conditions.some((c) => (c.name.toLowerCase().includes("cholesterol") || c.name.toLowerCase().includes("lipid")) && c.status !== "resolved");
  const hasRenal = conditions.some((c) => (c.name.toLowerCase().includes("kidney") || c.name.toLowerCase().includes("renal") || c.name.toLowerCase().includes("ckd")) && c.status !== "resolved");

  const activeCount = conditions.filter((c) => c.status === "active").length;
  const managedCount = conditions.filter((c) => c.status === "managed").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Personalized Care Protocol
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            {conditions.length} diagnosed chronic condition{conditions.length === 1 ? "" : "s"} · {activeCount} active protocol{activeCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Condition
          </Button>

          <Link
            href="/assistant"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <Stethoscope className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Consult Copilot</span>
          </Link>
        </div>
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

      {/* Target Biomarker Protocol Status Card */}
      <section className="soft-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--foreground)] tracking-tight">
                Clinical Targets & Biomarker Goals
              </h2>
              <span className="text-xs text-[var(--muted-foreground)] block">
                Evidence-based management goals aligned with your active chronic conditions.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 self-start sm:self-auto bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800">
            {hasDiabetes ? "ADA 2026 Guidelines" : hasHypertension ? "AHA/ACC 2026 Guidelines" : "Clinical Preventive Standard"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
          <div className="soft-card p-3.5 text-center space-y-1">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block">
              {hasDiabetes ? "Target HbA1c" : "Target Fasting"}
            </span>
            <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
              {hasDiabetes ? "< 7.0%" : "70 - 99 mg/dL"}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] block">
              {hasDiabetes ? "Quarterly Glycemic Goal" : "Euglycemic Goal"}
            </span>
          </div>

          <div className="soft-card p-3.5 text-center space-y-1">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block">
              Blood Pressure
            </span>
            <div className="text-lg font-extrabold text-[var(--foreground)]">
              {hasHypertension ? "< 130/80" : "< 120/80"}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] block">
              mmHg (Resting Target)
            </span>
          </div>

          <div className="soft-card p-3.5 text-center space-y-1">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block">
              {hasLipids ? "Target LDL" : "Total Cholesterol"}
            </span>
            <div className="text-lg font-extrabold text-[var(--foreground)]">
              {hasLipids ? "< 70 mg/dL" : "< 200 mg/dL"}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] block">
              Lipid Lowering Protocol
            </span>
          </div>

          <div className="soft-card p-3.5 text-center space-y-1">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block">
              Renal Function
            </span>
            <div className="text-lg font-extrabold text-[var(--foreground)]">
              {hasRenal ? "eGFR > 60" : "UACR < 30"}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] block">
              {hasRenal ? "mL/min/1.73m² (Stable)" : "mg/g (Normal Albumin)"}
            </span>
          </div>
        </div>
      </section>

      {/* CHRONIC CONDITION MANAGEMENT DIRECTORY */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-extrabold text-[var(--foreground)]">
              Managed Chronic Conditions
            </h2>
          </div>
          <span className="text-xs font-bold text-[var(--muted-foreground)]">
            {managedCount} well managed · {activeCount} active
          </span>
        </div>

        {conditions.length === 0 ? (
          <div className="soft-card p-10 text-center space-y-3">
            <Activity className="mx-auto h-8 w-8 text-[var(--muted-foreground)]/40" />
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              No chronic conditions registered
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              Add diagnoses such as Type 2 Diabetes, Hypertension, or Asthma to generate tailored clinical protocols and drug safety checks.
            </p>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Your First Condition
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conditions.map((cond) => {
              const linkedMeds = medications.filter((m) =>
                m.related_condition?.toLowerCase().includes(cond.name.toLowerCase().slice(0, 5)) ||
                m.instructions?.toLowerCase().includes(cond.name.toLowerCase().slice(0, 5))
              );

              return (
                <div
                  key={cond.id}
                  className="soft-card hover-lift flex flex-col justify-between p-5 space-y-4 group transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-sm sm:text-base text-[var(--foreground)] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {cond.name}
                          </h3>
                          {cond.icd10 && (
                            <span className="rounded-md border border-[var(--border)] bg-[var(--secondary)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--muted-foreground)]">
                              ICD-10: {cond.icd10}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--muted-foreground)] block">
                          Diagnosed: {cond.diagnosed_date}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={cond.status}
                          onChange={(e) => handleUpdateStatus(cond.id, e.target.value as any)}
                          className={`rounded-xl px-2.5 py-1 text-[10px] font-extrabold border cursor-pointer focus:outline-none transition-colors ${
                            cond.status === "managed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                              : cond.status === "resolved"
                              ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                              : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                          }`}
                        >
                          <option value="active">Active Protocol</option>
                          <option value="managed">Well Managed</option>
                          <option value="resolved">Resolved / Remission</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(cond.id, cond.name)}
                          title="Remove condition"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {cond.notes && (
                      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)] pt-2.5">
                        {cond.notes}
                      </p>
                    )}

                    {/* Linked Medications */}
                    <div className="border-t border-[var(--border)] pt-2.5 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-[var(--muted-foreground)] flex items-center gap-1.5">
                        <Pill className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Linked Regimen:
                      </span>
                      <span className="font-semibold text-[var(--foreground)]">
                        {linkedMeds.length > 0
                          ? linkedMeds.map((m) => m.name).join(", ")
                          : "No prescriptions linked"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[11px]">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active Surveillance Active
                    </span>
                    <Link
                      href="/assistant"
                      className="font-bold text-[var(--foreground)] hover:text-emerald-600 inline-flex items-center gap-1"
                    >
                      <span>Copilot Guidance</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Preventive Screening Cadence */}
      <section className="space-y-3">
        <span className="px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block">
          Preventive Surveillance Schedule
        </span>
        <div className="soft-card divide-y divide-[var(--border)] overflow-hidden p-0">
          <div className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  Comprehensive Metabolic Panel (CMP) &amp; HbA1c
                </span>
                <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Quarterly Cadence
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                Serum creatinine, estimated GFR, fasting blood glucose, and electrolytes surveillance.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  Dilated Retinal Eye Examination
                </span>
                <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Annual Surveillance
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                Fundus photographic assessment to detect early microvascular retinal changes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  Urine Albumin-to-Creatinine Ratio (UACR)
                </span>
                <span className="shrink-0 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Annual Renal Check
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                Early microalbuminuria detection to ensure long-term nephropathy protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ADD CHRONIC CONDITION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg space-y-4 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-[var(--foreground)]">
                  Add Chronic Condition
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Presets Selection */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
                Quick Clinical Presets:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {CONDITION_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-emerald-500/50 hover:bg-[var(--muted)] transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddCondition} className="space-y-3.5 text-xs pt-1">
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Condition / Diagnosis Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Type 2 Diabetes Mellitus"
                  value={condName}
                  onChange={(e) => setCondName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    ICD-10 Code
                  </label>
                  <Input
                    placeholder="e.g. E11.9, I10"
                    value={icd10}
                    onChange={(e) => setIcd10(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Diagnosis Date
                  </label>
                  <Input
                    type="date"
                    value={diagnosedDate}
                    onChange={(e) => setDiagnosedDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Current Management Status
                </label>
                <select
                  value={condStatus}
                  onChange={(e) => setCondStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-2.5 text-xs font-semibold text-[var(--foreground)] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="active">Active Protocol (Under active treatment/monitoring)</option>
                  <option value="managed">Well Managed (Stable and within clinical target)</option>
                  <option value="resolved">Resolved / In Remission</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Clinical Goals &amp; Management Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Target HbA1c < 7.0%, maintain low carbohydrate lifestyle, daily blood sugar logs."
                  value={condNotes}
                  onChange={(e) => setCondNotes(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-2.5 text-xs text-[var(--foreground)] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-[var(--border)] pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      Saving to Protocol...
                    </>
                  ) : (
                    "Save Condition"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
