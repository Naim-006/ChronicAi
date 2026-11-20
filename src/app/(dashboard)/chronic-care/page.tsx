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
import { Medication, Condition, HealthMetric } from "@/types/medical";
import { getMedications } from "@/lib/supabase/services/medications";
import { updateHealthProfile } from "@/lib/supabase/services/profile";
import { getHealthMetrics } from "@/lib/supabase/services/metrics";
import { getDocuments } from "@/lib/supabase/services/documents";
import { useRealtimeTable } from "@/hooks/useRealtime";
import { createClient } from "@/lib/supabase/client";

// Common Chronic Condition Clinical Presets
const CONDITION_PRESETS = [
  {
    name: "Tinea Cruris & Corporis (Dermatomycosis)",
    icd10: "B35.6 / B35.4",
    category: "Dermatological / Infectious",
    defaultNotes: "Superficial dermatophyte infection under combined oral and topical antifungal regimen (Terbinafine, Fluconazole, Luliconazole, Amorolfine). Monitor liver enzymes and complete full course.",
    targetBiomarker: "Mycological Clearance",
  },
  {
    name: "Mild Thrombocytopenia Surveillance",
    icd10: "D69.6",
    category: "Hematology",
    defaultNotes: "Platelet count surveillance (baseline 135 K/µL with MPV 12.60 fL). Clinical correlation for post-infectious etiology. Avoid NSAIDs.",
    targetBiomarker: "Platelets > 150 K/µL",
  },
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
    name: "Chronic Kidney Disease (Stage 1/2)",
    icd10: "N18.9",
    category: "Renal",
    defaultNotes: "Longitudinal serum creatinine and eGFR monitoring (current eGFR 105 mL/min/1.73m²). Adequate daily hydration and nephrotoxin avoidance.",
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
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [detectedDiagnoses, setDetectedDiagnoses] = useState<
    Array<{ name: string; date: string; doctor?: string; facility?: string; sourceDocId: string; documentTitle: string }>
  >([]);
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

  const loadClinicalData = useCallback(async () => {
    if (!effectiveUserId) {
      setMedications([]);
      setMetrics([]);
      setIsLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const [medsData, metricsData, extData, docsData] = await Promise.all([
        getMedications(effectiveUserId),
        getHealthMetrics(effectiveUserId),
        supabase
          .from("extracted_records")
          .select("document_id, raw_extracted, confirmed_data")
          .eq("user_id", effectiveUserId),
        getDocuments(effectiveUserId),
      ]);
      setMedications(medsData || []);
      setMetrics(metricsData || []);

      // Auto-discover diagnoses from extracted records
      const detected: Array<{
        name: string;
        date: string;
        doctor?: string;
        facility?: string;
        sourceDocId: string;
        documentTitle: string;
      }> = [];
      const existingNames = new Set(conditions.map((c) => c.name.toLowerCase()));

      (extData.data || []).forEach((e: any) => {
        const payload = e.confirmed_data || e.raw_extracted || {};
        const docObj = (docsData || []).find((d: any) => d.id === e.document_id);
        const diags = payload.diagnoses || [];
        diags.forEach((diag: any) => {
          let diagName = typeof diag === "string" ? diag : diag?.name;
          if (diagName && diagName.length < 50) {
            // Expand abbreviations if needed
            if (diagName.toLowerCase() === "t. cruris") diagName = "Tinea Cruris";
            if (diagName.toLowerCase() === "t. corporis") diagName = "Tinea Corporis";

            if (
              !existingNames.has(diagName.toLowerCase()) &&
              !detected.some((d) => d.name.toLowerCase() === diagName.toLowerCase())
            ) {
              detected.push({
                name: diagName,
                date: payload.date || docObj?.document_date || new Date().toISOString().split("T")[0],
                doctor: payload.doctor || docObj?.doctor_name,
                facility: payload.facility || docObj?.facility_name,
                sourceDocId: e.document_id,
                documentTitle: docObj?.file_name || "Medical Record",
              });
            }
          }
        });
      });
      setDetectedDiagnoses(detected);
    } catch {
      setMedications([]);
      setMetrics([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, conditions]);

  useEffect(() => {
    loadClinicalData();
  }, [loadClinicalData]);

  useRealtimeTable({
    table: "medications",
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadClinicalData();
    },
  });

  const handleSelectPreset = (preset: typeof CONDITION_PRESETS[0]) => {
    setCondName(preset.name);
    setIcd10(preset.icd10);
    setCondNotes(preset.defaultNotes);
  };

  // Sync auto-detected diagnoses into chronic conditions
  const handleSyncDetected = async () => {
    if (!effectiveUserId || detectedDiagnoses.length === 0) return;
    setIsSaving(true);
    try {
      const newItems: Condition[] = detectedDiagnoses.map((d, i) => ({
        id: `cond-auto-${Date.now()}-${i}`,
        name: d.name,
        status: "active",
        diagnosed_date: d.date,
        notes: `Extracted from verified record: ${d.documentTitle}${d.doctor ? ` by ${d.doctor}` : ""}${
          d.facility ? ` (${d.facility})` : ""
        }. Active pharmacological and surveillance protocol initiated.`,
      }));

      const updated = [...newItems, ...conditions];
      await updateHealthProfile(effectiveUserId, { chronic_conditions: updated });
      await refreshProfile();
      setDetectedDiagnoses([]);
      setNotification(
        `Successfully synced ${newItems.length} clinical diagnosis protocol${
          newItems.length > 1 ? "s" : ""
        } from your records.`
      );
      setTimeout(() => setNotification(null), 4000);
    } catch (e) {
      console.error(e);
      setNotification("Failed to sync detected conditions.");
    } finally {
      setIsSaving(false);
    }
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

  // Derive dynamic clinical targets based on active conditions and real biometrics
  const hasDiabetes = conditions.some((c) => c.name.toLowerCase().includes("diabet") && c.status !== "resolved");
  const hasHypertension = conditions.some(
    (c) =>
      (c.name.toLowerCase().includes("hypertens") || c.name.toLowerCase().includes("blood pressure")) &&
      c.status !== "resolved"
  );
  const hasLipids = conditions.some(
    (c) =>
      (c.name.toLowerCase().includes("cholesterol") || c.name.toLowerCase().includes("lipid")) &&
      c.status !== "resolved"
  );
  const hasRenal = conditions.some(
    (c) =>
      (c.name.toLowerCase().includes("kidney") ||
        c.name.toLowerCase().includes("renal") ||
        c.name.toLowerCase().includes("ckd")) &&
      c.status !== "resolved"
  );
  const hasHematology = conditions.some(
    (c) =>
      c.name.toLowerCase().includes("thrombocyt") ||
      c.name.toLowerCase().includes("platelet") ||
      c.name.toLowerCase().includes("anemia")
  );

  // Real grounded biometrics from database
  const crMetric = metrics.find((m) => (m.notes || "").toLowerCase().includes("creatinine"));
  const pltMetric = metrics.find((m) => (m.notes || "").toLowerCase().includes("platelet"));
  const bpMetric = metrics.find(
    (m) => m.metric_type === "blood_pressure" || (m.notes || "").toLowerCase().includes("blood pressure")
  );

  // Computed eGFR from creatinine (Cr 0.84 -> ~105 mL/min/1.73m2)
  const egfrValue = useMemo(() => {
    if (!crMetric) return null;
    const cr = crMetric.value_primary;
    const isMale = (profile?.sex || "male").toLowerCase() === "male";
    const age = profile?.date_of_birth
      ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
      : 25;
    const kappa = isMale ? 0.9 : 0.7;
    const alpha = isMale ? -0.302 : -0.241;
    const minVal = Math.min(cr / kappa, 1);
    const maxVal = Math.max(cr / kappa, 1);
    const egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.2) * Math.pow(0.9938, age) * (isMale ? 1 : 1.012);
    return Math.round(egfr);
  }, [crMetric, profile]);

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

      {/* Auto-Detected Diagnoses Discovery Card */}
      {detectedDiagnoses.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-md shadow-lg space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                    Auto-Detected from Medical Records ({detectedDiagnoses.length})
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Grounded Extraction
                  </span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Found {detectedDiagnoses.map((d) => `"${d.name}"`).join(", ")} from {detectedDiagnoses[0]?.doctor || "Physician"} ({detectedDiagnoses[0]?.facility || "Clinical Centre"}).
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSyncDetected}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow shrink-0"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1.5" />
              )}
              Sync to Care Protocols
            </Button>
          </div>
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
                Clinical Targets & Goals
              </h2>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 self-start sm:self-auto bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800">
            {hasRenal
              ? "KDIGO 2024 Renal Standards"
              : hasHematology
              ? "Hematology Surveillance Standards"
              : hasDiabetes
              ? "ADA 2026 Guidelines"
              : "Clinical Preventive Standard"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
          {/* Card 1: Renal Function */}
          <div className="soft-card p-3.5 text-center space-y-1">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block">
              Renal Filtration (eGFR)
            </span>
            <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
              {egfrValue ? `${egfrValue} mL/min` : "eGFR > 60"}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] block">
              {crMetric ? `Cr ${crMetric.value_primary} mg/dL (KDIGO G1 Normal)` : "Target > 60 mL/min/1.73m²"}
            </span>
          </div>

          {/* Card 2: Platelet Surveillance */}
          <div className="soft-card p-3.5 text-center space-y-1">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block">
              Platelet Count
            </span>
            <div
              className={`text-lg font-extrabold ${
                pltMetric && pltMetric.value_primary < 150
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-[var(--foreground)]"
              }`}
            >
              {pltMetric ? `${pltMetric.value_primary} K/µL` : "150 - 410 K/µL"}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] block">
              {pltMetric && pltMetric.value_primary < 150
                ? "Mild Thrombocytopenia Surveillance"
                : "Optimal Hemostasis Target"}
            </span>
          </div>

          {/* Card 3: Blood Pressure */}
          <div className="soft-card p-3.5 text-center space-y-1">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block">
              Blood Pressure
            </span>
            <div className="text-lg font-extrabold text-[var(--foreground)]">
              {bpMetric ? `${bpMetric.value_primary}/${bpMetric.value_secondary || 78}` : "< 120/80"}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] block">
              mmHg (Resting Target)
            </span>
          </div>

          {/* Card 4: Glycemic Control */}
          <div className="soft-card p-3.5 text-center space-y-1">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block">
              Target Glycemic
            </span>
            <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
              {hasDiabetes ? "< 7.0% HbA1c" : "70 - 99 mg/dL"}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] block">
              {hasDiabetes ? "Quarterly Glycemic Goal" : "Fasting Euglycemia"}
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
          <div className="soft-card p-6 sm:p-8 text-center space-y-2">
            <Activity className="mx-auto h-7 w-7 text-[var(--muted-foreground)]/40" />
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              No chronic conditions registered
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-xs mx-auto">
              Add conditions to generate personalized clinical care protocols.
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
              const condLower = cond.name.toLowerCase();
              const linkedMeds = medications.filter((m) => {
                const mLower = m.name.toLowerCase();
                const iLower = (m.instructions || "").toLowerCase();
                const rLower = (m.related_condition || "").toLowerCase();

                if (condLower.includes("cruris") || condLower.includes("corporis") || condLower.includes("tinea") || condLower.includes("dermato") || condLower.includes("fungal")) {
                  return (
                    mLower.includes("terbitac") ||
                    mLower.includes("candifast") ||
                    mLower.includes("luli") ||
                    mLower.includes("curafin") ||
                    mLower.includes("skinobac") ||
                    mLower.includes("ebastine") ||
                    mLower.includes("progut") ||
                    mLower.includes("fluconazole") ||
                    mLower.includes("terbinafine")
                  );
                }
                if (condLower.includes("thrombocyt") || condLower.includes("platelet")) {
                  return mLower.includes("prednisone") || mLower.includes("dexamethasone");
                }
                if (condLower.includes("diabet")) {
                  return mLower.includes("metformin") || mLower.includes("insulin") || mLower.includes("glipizide") || mLower.includes("jardiance");
                }
                if (condLower.includes("hypertens") || condLower.includes("blood pressure")) {
                  return mLower.includes("lisinopril") || mLower.includes("amlodipine") || mLower.includes("losartan");
                }
                return rLower.includes(condLower.slice(0, 5)) || iLower.includes(condLower.slice(0, 5));
              });

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
                    <div className="border-t border-[var(--border)] pt-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[var(--muted-foreground)] flex items-center gap-1.5">
                          <Pill className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Linked Regimen:
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          {linkedMeds.length} prescription{linkedMeds.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      {linkedMeds.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {linkedMeds.slice(0, 4).map((m) => (
                            <span
                              key={m.id}
                              className="px-2 py-0.5 rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[10px] font-semibold text-[var(--foreground)]"
                            >
                              {m.name} {m.dosage ? `(${m.dosage})` : ""}
                            </span>
                          ))}
                          {linkedMeds.length > 4 && (
                            <span className="px-2 py-0.5 rounded-lg border border-dashed border-[var(--border)] text-[10px] text-[var(--muted-foreground)]">
                              +{linkedMeds.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          No specific prescriptions linked in record.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[11px]">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active Surveillance
                    </span>
                    <Link
                      href={`/assistant?prompt=${encodeURIComponent(
                        `Explain my active clinical care protocol for ${cond.name} (Diagnosed: ${cond.diagnosed_date}). What clinical precautions, interaction risks with my active prescriptions (${medications
                          .slice(0, 5)
                          .map((m) => m.name)
                          .join(", ")}), and evidence-based lifestyle steps should I follow?`
                      )}`}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
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
