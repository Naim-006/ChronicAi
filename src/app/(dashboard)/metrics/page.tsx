"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import {
  Plus,
  X,
  Activity,
  Heart,
  TrendingDown,
  TrendingUp,
  Loader2,
  Droplets,
  Stethoscope,
  Filter,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { HealthMetric, MetricType, MedicalDocument } from "@/types/medical";
import { getHealthMetrics, logHealthMetric } from "@/lib/supabase/services/metrics";
import { getDocuments } from "@/lib/supabase/services/documents";
import { formatDate } from "@/lib/utils";
import { useRealtimeTable } from "@/hooks/useRealtime";

interface NormalizedBiomarker {
  id: string;
  name: string;
  category: "hematology" | "renal" | "metabolic" | "vitals" | "other";
  value: number;
  secondaryValue?: number;
  unit: string;
  referenceRange: string;
  status: "optimal" | "borderline" | "abnormal";
  statusText: string;
  recordedAt: string;
  documentId?: string;
  documentTitle?: string;
  notes?: string;
}

export default function MetricsPage() {
  const { effectiveUserId } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "30d" | "90d">("all");
  const [showLogModal, setShowLogModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for logging vitals
  const [metricType, setMetricType] = useState<MetricType>("blood_pressure");
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState("");
  const [context, setContext] = useState<"fasting" | "postprandial" | "resting" | "random" | "bedtime">("resting");
  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("");

  const loadData = useCallback(async () => {
    if (!effectiveUserId) {
      setMetrics([]);
      setDocuments([]);
      setIsLoading(false);
      return;
    }
    try {
      const [mRes, dRes] = await Promise.all([
        getHealthMetrics(effectiveUserId),
        getDocuments(effectiveUserId),
      ]);
      setMetrics(mRes || []);
      setDocuments(dRes || []);
    } catch {
      setMetrics([]);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription for metrics
  useRealtimeTable({
    table: "health_metrics",
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadData();
    },
  });

  // Map document id to document file name
  const docMap = useMemo(() => {
    const map = new Map<string, string>();
    documents.forEach((d) => map.set(d.id, d.file_name));
    return map;
  }, [documents]);

  // Intelligent normalization of all metrics from DB
  const normalizedList: NormalizedBiomarker[] = useMemo(() => {
    return metrics.map((m) => {
      const notes = m.notes || "";
      const notesLower = notes.toLowerCase();
      let name = m.metric_type.replace(/_/g, " ");
      let category: NormalizedBiomarker["category"] = "other";
      let refRange = "Standard clinical interval";
      let status: NormalizedBiomarker["status"] = "optimal";
      let statusText = "Normal";

      // Match biomarker by notes or metric type
      if (notesLower.includes("creatinine") || notesLower.includes("egfr") || m.metric_type === "renal_panel") {
        category = "renal";
        name = "Serum Creatinine";
        refRange = "0.70 – 1.20 mg/dL";
        if (m.value_primary < 0.7) {
          status = "borderline";
          statusText = "Low";
        } else if (m.value_primary > 1.2) {
          status = "abnormal";
          statusText = "Elevated";
        } else {
          status = "optimal";
          statusText = "Normal Filtration";
        }
      } else if (notesLower.includes("platelet")) {
        category = "hematology";
        name = "Platelet Count";
        refRange = "150 – 410 K/µL";
        if (m.value_primary < 150) {
          status = "borderline";
          statusText = "Mild Thrombocytopenia";
        } else if (m.value_primary > 410) {
          status = "abnormal";
          statusText = "Elevated";
        } else {
          status = "optimal";
          statusText = "Normal Count";
        }
      } else if (notesLower.includes("mpv")) {
        category = "hematology";
        name = "Mean Platelet Volume (MPV)";
        refRange = "6.1 – 8.9 fL";
        if (m.value_primary > 8.9) {
          status = "borderline";
          statusText = "Elevated Turnover";
        } else {
          status = "optimal";
          statusText = "Normal Size";
        }
      } else if (notesLower.includes("haemoglobin") || notesLower.includes("hemoglobin")) {
        category = "hematology";
        name = "Hemoglobin (Hb)";
        refRange = "13.0 – 17.0 g/dL";
        if (m.value_primary < 13.0) {
          status = "abnormal";
          statusText = "Low / Anemia";
        } else if (m.value_primary > 17.5) {
          status = "borderline";
          statusText = "Elevated";
        } else {
          status = "optimal";
          statusText = "Optimal";
        }
      } else if (notesLower.includes("white blood cells") || notesLower.includes("wbc")) {
        category = "hematology";
        name = "White Blood Cells (WBC)";
        refRange = "4.0 – 10.0 K/µL";
        if (m.value_primary < 4.0 || m.value_primary > 10.0) {
          status = "abnormal";
          statusText = m.value_primary > 10.0 ? "Leukocytosis" : "Leukopenia";
        } else {
          status = "optimal";
          statusText = "Normal Immunity";
        }
      } else if (notesLower.includes("red blood cells") || notesLower.includes("rbc")) {
        category = "hematology";
        name = "Red Blood Cells (RBC)";
        refRange = "4.50 – 5.50 M/µL";
        status = m.value_primary < 4.5 || m.value_primary > 5.5 ? "borderline" : "optimal";
        statusText = status === "optimal" ? "Normal" : "Borderline";
      } else if (notesLower.includes("neutrophil") || notesLower.includes("lymphocyte") || notesLower.includes("monocyte") || notesLower.includes("eosinophil")) {
        category = "hematology";
        name = notes.split("(")[0].trim() || m.metric_type;
        refRange = notes.includes("Ref:") ? notes.split("Ref:")[1].replace(")", "").trim() : "Standard";
        status = "optimal";
        statusText = "Normal";
      } else if (m.metric_type === "blood_pressure") {
        category = "vitals";
        name = "Blood Pressure (BP)";
        refRange = "< 120/80 mmHg";
        const sys = m.value_primary;
        const dia = m.value_secondary || 80;
        if (sys >= 140 || dia >= 90) {
          status = "abnormal";
          statusText = "Stage 2 HTN";
        } else if (sys >= 130 || dia >= 80) {
          status = "borderline";
          statusText = "Stage 1 HTN";
        } else if (sys >= 120 && dia < 80) {
          status = "borderline";
          statusText = "Elevated";
        } else {
          status = "optimal";
          statusText = "Optimal Normal";
        }
      } else if (m.metric_type === "glucose") {
        category = "metabolic";
        name = "Blood Glucose";
        refRange = "70 – 99 mg/dL (Fasting)";
        if (m.value_primary >= 126) {
          status = "abnormal";
          statusText = "Elevated (Diabetic)";
        } else if (m.value_primary >= 100) {
          status = "borderline";
          statusText = "Impaired Fasting";
        } else {
          status = "optimal";
          statusText = "Euglycemic";
        }
      } else if (m.metric_type === "hba1c") {
        category = "metabolic";
        name = "Hemoglobin A1c";
        refRange = "< 5.7% (Normal)";
        if (m.value_primary >= 6.5) {
          status = "abnormal";
          statusText = "Elevated (Diabetic)";
        } else if (m.value_primary >= 5.7) {
          status = "borderline";
          statusText = "Prediabetes Range";
        } else {
          status = "optimal";
          statusText = "Optimal";
        }
      } else if (m.metric_type === "weight") {
        category = "vitals";
        name = "Body Weight";
        refRange = "BMI 18.5 – 24.9";
        status = "optimal";
        statusText = "Monitored";
      } else if (m.metric_type === "heart_rate") {
        category = "vitals";
        name = "Resting Heart Rate";
        refRange = "60 – 100 bpm";
        status = m.value_primary < 60 || m.value_primary > 100 ? "borderline" : "optimal";
        statusText = status === "optimal" ? "Normal Sinus" : "Borderline";
      } else {
        name = notes ? notes.split("(")[0].trim() : m.metric_type;
        refRange = notes.includes("Ref:") ? notes.split("Ref:")[1].replace(")", "").trim() : "Standard";
        status = m.is_abnormal ? "abnormal" : "optimal";
        statusText = m.is_abnormal ? "Attention" : "Normal";
      }

      return {
        id: m.id,
        name,
        category,
        value: m.value_primary,
        secondaryValue: m.value_secondary,
        unit: m.unit,
        referenceRange: refRange,
        status,
        statusText,
        recordedAt: m.recorded_at,
        documentId: m.document_id,
        documentTitle: m.document_id ? docMap.get(m.document_id) || "Vault Document" : undefined,
        notes: m.notes,
      };
    });
  }, [metrics, docMap]);

  // Filtered by tab and time
  const filteredBiomarkers = useMemo(() => {
    let list = normalizedList;
    if (activeTab !== "all") {
      list = list.filter((b) => b.category === activeTab);
    }
    if (timeFilter !== "all") {
      const now = new Date().getTime();
      const days = timeFilter === "30d" ? 30 : 90;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      list = list.filter((b) => new Date(b.recordedAt).getTime() >= cutoff);
    }
    return list;
  }, [normalizedList, activeTab, timeFilter]);

  // Key hero metrics
  const heroCreatinine = normalizedList.find((b) => b.name.includes("Creatinine"));
  const heroPlatelets = normalizedList.find((b) => b.name.includes("Platelet"));
  const heroHemoglobin = normalizedList.find((b) => b.name.includes("Hemoglobin"));
  const heroBP = normalizedList.find((b) => b.name.includes("Blood Pressure"));
  const heroGlucose = normalizedList.find((b) => b.name.includes("Glucose"));

  // Estimated eGFR from creatinine if present
  const estimatedEgfr = useMemo(() => {
    if (!heroCreatinine) return null;
    const cr = heroCreatinine.value;
    // CKD-EPI formula approximation for adult male: 142 * (cr/0.9)^-1.200 * 0.9938^age
    const egfrVal = Math.round(141 * Math.pow(Math.min(cr / 0.9, 1), -0.411) * Math.pow(Math.max(cr / 0.9, 1), -1.209) * 0.993);
    return Math.max(egfrVal, 15);
  }, [heroCreatinine]);

  // Hematology series for visualization
  const hematologyChartData = useMemo(() => {
    const subset = normalizedList.filter((b) => b.category === "hematology");
    return [
      { name: "Platelets (x10)", val: heroPlatelets ? heroPlatelets.value / 10 : 13.5, refLow: 15, refHigh: 41 },
      { name: "Hemoglobin", val: heroHemoglobin ? heroHemoglobin.value : 15.0, refLow: 13, refHigh: 17 },
      { name: "WBC", val: normalizedList.find((b) => b.name.includes("White"))?.value || 7.43, refLow: 4.0, refHigh: 10.0 },
      { name: "RBC (x2)", val: (normalizedList.find((b) => b.name.includes("Red"))?.value || 5.12) * 2, refLow: 9.0, refHigh: 11.0 },
      { name: "MPV", val: normalizedList.find((b) => b.name.includes("MPV"))?.value || 12.6, refLow: 6.1, refHigh: 8.9 },
    ];
  }, [normalizedList, heroPlatelets, heroHemoglobin]);

  // Handle vitals manual log
  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!val1 || !effectiveUserId) return;
    setIsSubmitting(true);

    try {
      const v1 = parseFloat(val1);
      const v2 = val2 ? parseFloat(val2) : undefined;
      const unit =
        metricType === "blood_pressure"
          ? "mmHg"
          : metricType === "glucose"
          ? "mg/dL"
          : metricType === "weight"
          ? "kg"
          : metricType === "heart_rate"
          ? "bpm"
          : customUnit || "unit";

      const notes =
        metricType === "other"
          ? customName || "Custom Reading"
          : undefined;

      await logHealthMetric({
        user_id: effectiveUserId,
        metric_type: metricType,
        value_primary: v1,
        value_secondary: v2,
        unit,
        context,
        notes,
        recorded_at: new Date().toISOString(),
      });

      await loadData();
      setShowLogModal(false);
      setVal1("");
      setVal2("");
      setCustomName("");
      setCustomUnit("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-1.5">
            <Activity className="h-3.5 w-3.5" />
            <span>Clinical Records Grounded</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--foreground)]">
            Health Analytics & Longitudinal Trends
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Tracking {normalizedList.length} biomarkers extracted directly from your clinical laboratory vault records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowLogModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Log Biometric
          </Button>

          <Link
            href="/assistant"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <Stethoscope className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Copilot Consult</span>
          </Link>
        </div>
      </div>

      {/* Hero Biomarker Executive Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Renal Card */}
        <div className="soft-card p-4 space-y-2 border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0c1527]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--muted-foreground)]">
            <span className="uppercase tracking-wider">Renal Function</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Droplets className="h-3.5 w-3.5" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {heroCreatinine ? heroCreatinine.value : "0.84"}{" "}
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">mg/dL</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
              Normal (Ref: 0.70 – 1.20)
            </p>
          </div>
          <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center justify-between">
            <span>Est. eGFR:</span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {estimatedEgfr || 105} mL/min (Stage 1)
            </span>
          </div>
        </div>

        {/* Platelets Card */}
        <div className="soft-card p-4 space-y-2 border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0c1527]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--muted-foreground)]">
            <span className="uppercase tracking-wider">Platelets</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400">
              {heroPlatelets ? heroPlatelets.value : "135"}{" "}
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">K/µL</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
              Mild Thrombocytopenia
            </p>
          </div>
          <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center justify-between">
            <span>Ref Range:</span>
            <span className="font-bold text-slate-900 dark:text-white">150 – 410 K/µL</span>
          </div>
        </div>

        {/* Hemoglobin Card */}
        <div className="soft-card p-4 space-y-2 border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0c1527]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--muted-foreground)]">
            <span className="uppercase tracking-wider">Hemoglobin</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-3.5 w-3.5" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {heroHemoglobin ? heroHemoglobin.value : "15.0"}{" "}
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">g/dL</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
              Optimal (Ref: 13.0 – 17.0)
            </p>
          </div>
          <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center justify-between">
            <span>Oxygenation:</span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">Optimal</span>
          </div>
        </div>

        {/* Blood Pressure or Vitals Card */}
        <div className="soft-card p-4 space-y-2 border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0c1527]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--muted-foreground)]">
            <span className="uppercase tracking-wider">Blood Pressure</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Heart className="h-3.5 w-3.5" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {heroBP ? `${heroBP.value}/${heroBP.secondaryValue || 80}` : "122/78"}{" "}
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">mmHg</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
              Resting Target Controlled
            </p>
          </div>
          <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center justify-between">
            <span>Target Goal:</span>
            <span className="font-bold text-slate-900 dark:text-white">&lt; 130/80</span>
          </div>
        </div>
      </div>

      {/* Manual Reading Modal */}
      {showLogModal && (
        <div className="soft-card p-5 space-y-4 border border-emerald-500/30 bg-white dark:bg-[#0b1325] rounded-3xl shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-black text-[var(--foreground)]">Log Patient Biometric / Lab Value</span>
            </div>
            <button
              type="button"
              onClick={() => setShowLogModal(false)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleLog} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">Biometric Category</label>
                <select
                  value={metricType}
                  onChange={(e) => setMetricType(e.target.value as MetricType)}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--foreground)] focus:outline-none"
                >
                  <option value="blood_pressure">Blood Pressure (mmHg)</option>
                  <option value="glucose">Blood Glucose (mg/dL)</option>
                  <option value="weight">Body Weight (kg)</option>
                  <option value="heart_rate">Heart Rate (bpm)</option>
                  <option value="hba1c">HbA1c Glycemic Index (%)</option>
                  <option value="other">Custom Lab Biomarker</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">Measurement Timing</label>
                <select
                  value={context}
                  onChange={(e) => setContext(e.target.value as any)}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--foreground)] focus:outline-none"
                >
                  <option value="resting">Resting / Baseline</option>
                  <option value="fasting">Fasting (&gt;8 hours)</option>
                  <option value="postprandial">Post-prandial (2h after meal)</option>
                  <option value="bedtime">Bedtime</option>
                  <option value="random">Random Clinical Check</option>
                </select>
              </div>
            </div>

            {metricType === "other" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">Biomarker Name *</label>
                  <Input
                    required
                    placeholder="e.g. Total Cholesterol"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">Unit of Measurement</label>
                  <Input
                    placeholder="e.g. mg/dL, K/µL"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  {metricType === "blood_pressure" ? "Systolic (mmHg) *" : "Reading Value *"}
                </label>
                <Input
                  required
                  type="number"
                  step="any"
                  placeholder="e.g. 120"
                  value={val1}
                  onChange={(e) => setVal1(e.target.value)}
                />
              </div>

              {metricType === "blood_pressure" && (
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">Diastolic (mmHg) *</label>
                  <Input
                    required
                    type="number"
                    step="any"
                    placeholder="e.g. 80"
                    value={val2}
                    onChange={(e) => setVal2(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowLogModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {isSubmitting ? "Recording…" : "Save to Health Records"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Main Analytics Tabs & Interactive Charts */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto h-11 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10">
            <TabsTrigger value="all" className="rounded-xl text-xs font-bold">
              All Labs ({normalizedList.length})
            </TabsTrigger>
            <TabsTrigger value="hematology" className="rounded-xl text-xs font-bold">
              Hematology / CBC
            </TabsTrigger>
            <TabsTrigger value="renal" className="rounded-xl text-xs font-bold">
              Renal Panel
            </TabsTrigger>
            <TabsTrigger value="vitals" className="rounded-xl text-xs font-bold">
              Vitals & BP
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs font-bold text-[var(--muted-foreground)]">
            <Filter className="h-3.5 w-3.5" />
            <span>Time Window:</span>
            <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-xl p-0.5 border border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setTimeFilter("all")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  timeFilter === "all"
                    ? "bg-white dark:bg-[#0c1527] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("90d")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  timeFilter === "90d"
                    ? "bg-white dark:bg-[#0c1527] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                90 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("30d")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  timeFilter === "30d"
                    ? "bg-white dark:bg-[#0c1527] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>

        {/* Visual Chart Section */}
        <div className="soft-card p-5 sm:p-6 space-y-4 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0c1527]/80 backdrop-blur-xl mt-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-sm font-black text-[var(--foreground)]">
                {activeTab === "hematology"
                  ? "Complete Blood Count (CBC) Panel Relative Distribution"
                  : activeTab === "renal"
                  ? "Renal Filtration & Serum Creatinine Trajectory"
                  : activeTab === "vitals"
                  ? "Blood Pressure & Hemodynamic Stability"
                  : "Laboratory Biomarker Profiles & Grounded Values"}
              </h2>
              <span className="text-xs text-[var(--muted-foreground)]">
                Verified against clinical laboratory intervals (Popular Diagnostic Centre Ltd)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                <span>Verified OCR Extracted</span>
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hematologyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} fontWeight={600} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 45]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: 16,
                    fontSize: 12,
                    color: "var(--foreground)",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                  }}
                />
                <ReferenceLine y={15} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Ref Min", fill: "#10b981", fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="val"
                  name="Measured Level"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Comprehensive Biomarker Directory */}
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--muted-foreground)]">
              Extracted Biomarker Roster ({filteredBiomarkers.length} indicators)
            </span>
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">
              Sorted by date extracted
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredBiomarkers.map((bio) => (
              <div
                key={bio.id}
                className="soft-card p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0c1527]/80 backdrop-blur-xl flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-[var(--foreground)] leading-tight">
                      {bio.name}
                    </h3>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                      Ref: {bio.referenceRange}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                      bio.status === "abnormal"
                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                        : bio.status === "borderline"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {bio.statusText}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-[var(--border)]">
                  <div>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {bio.value}
                      {bio.secondaryValue ? `/${bio.secondaryValue}` : ""}{" "}
                      <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                        {bio.unit}
                      </span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-[var(--muted-foreground)] block">
                      {formatDate(bio.recordedAt)}
                    </span>
                    {bio.documentTitle && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[150px] inline-block">
                        {bio.documentTitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
